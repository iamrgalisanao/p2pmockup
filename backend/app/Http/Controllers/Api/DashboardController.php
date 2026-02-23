<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Requisition;
use App\Models\ApprovalStep;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * GET /api/dashboard
     * Returns paginated requisitions scoped to the user.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Requisition::with(['department', 'requester', 'currentApprovalStep'])
            ->orderByDesc('updated_at');

        // Scope: roles that can see all requisitions globally
        $globalRoles = ['admin', 'president', 'proc_officer', 'finance_reviewer', 'accounting_staff', 'accounting_supervisor', 'accounting_manager'];
        if (!in_array($user->role, $globalRoles)) {
            $query->where(function ($q) use ($user) {
                // Own Department or Project
                $q->where(function ($sq) use ($user) {
                    $sq->where('department_id', $user->department_id);
                    if (!empty($user->project_ids)) {
                        $sq->orWhereIn('project_id', $user->project_ids);
                    }
                });

                // Items specifically requested by me
                if ($user->isRequester()) {
                    $q->orWhere('requested_by', $user->id);
                }

                // IMPORTANT: If user is an active approver for a PR, they MUST see it on their dashboard
                // even if it's outside their primary department scope.
                $q->orWhereExists(function ($eq) use ($user) {
                    $eq->select(DB::raw(1))
                        ->from('approval_steps')
                        ->whereColumn('approval_steps.requisition_id', 'requisitions.id')
                        ->where('approval_steps.action', 'pending')
                        ->where('approval_steps.role_required', $user->role);
                });
            });
        }

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }
        if ($request->filled('search')) {
            $query->where(
                fn($q) =>
                $q->where('ref_number', 'like', "%{$request->search}%")
                    ->orWhere('title', 'like', "%{$request->search}%")
            );
        }

        return response()->json($query->paginate(15));
    }

    /**
     * GET /api/inbox
     * Returns pending approval steps assigned to the current user's role.
     */
    public function inbox(Request $request)
    {
        $user = $request->user();

        $steps = ApprovalStep::with(['requisition.department', 'requisition.requester', 'requisition.lineItems', 'requisition.project'])
            ->where('action', 'pending')
            ->where('role_required', $user->role)
            ->orderBy('sla_deadline')
            ->paginate(15);

        return response()->json($steps);
    }

    /**
     * GET /api/dashboard/stats
     */
    public function stats(Request $request)
    {
        $user = $request->user();

        $base = Requisition::query();
        $globalRoles = ['admin', 'president', 'proc_officer', 'finance_reviewer', 'accounting_staff', 'accounting_supervisor', 'accounting_manager'];
        if (!in_array($user->role, $globalRoles)) {
            $base->where(function ($q) use ($user) {
                // Own Department or Project
                $q->where(function ($sq) use ($user) {
                    $sq->where('department_id', $user->department_id);
                    if (!empty($user->project_ids)) {
                        $sq->orWhereIn('project_id', $user->project_ids);
                    }
                });

                // Items specifically requested by me
                if ($user->isRequester()) {
                    $q->orWhere('requested_by', $user->id);
                }

                // IMPORTANT: If user is an active approver for a PR, they MUST see it on their dashboard
                $q->orWhereExists(function ($eq) use ($user) {
                    $eq->select(DB::raw(1))
                        ->from('approval_steps')
                        ->whereColumn('approval_steps.requisition_id', 'requisitions.id')
                        ->where('approval_steps.action', 'pending')
                        ->where('approval_steps.role_required', $user->role);
                });
            });
        }

        $stats = [
            'total' => (clone $base)->count(),
            'draft' => (clone $base)->where('status', 'draft')->count(),
            'pending' => (clone $base)->whereIn('status', [
                'submitted',
                'under_review',
                'for_approval',
                'for_transmittal',
                'for_review',
                'for_endorsement'
            ])->count(),
            'for_quoting' => (clone $base)->where('status', 'for_quoting')->count(),
            'approved' => (clone $base)->where('status', 'approved')->count(),
            'po_issued' => (clone $base)->where('status', 'po_issued')->count(),
            'sla_breached' => ApprovalStep::where('action', 'pending')
                ->where('role_required', $user->role)
                ->whereNotNull('sla_deadline')
                ->where('sla_deadline', '<', now())
                ->count(),
            'inbox_count' => ApprovalStep::where('action', 'pending')
                ->where('role_required', $user->role)
                ->count(),
        ];

        return response()->json($stats);
    }
}
