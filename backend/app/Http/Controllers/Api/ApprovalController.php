<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Requisition;
use App\Models\ApprovalStep;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ApprovalController extends Controller
{
    /**
     * POST /api/requisitions/{requisition}/approval-steps/{step}/act
     */
    public function act(Request $request, Requisition $requisition, ApprovalStep $step)
    {
        $user = $request->user();

        // 1. Authorization Guard
        if ($step->role_required !== $user->role && !$user->isAdmin()) {
            return response()->json(['message' => 'You do not have the required role for this step.'], 403);
        }

        if ($step->action !== 'pending') {
            return response()->json(['message' => 'This step has already been actioned.'], 422);
        }

        $request->validate([
            'action' => 'required|in:approved,rejected,returned,on_hold',
            'comment' => 'required_if:action,rejected,returned,on_hold|nullable|string|max:1000',
        ]);

        // 2. Perform Concurrency-Safe Action (Optimistic Locking)
        $success = $step->performAction($request->action, $request->comment, $user);

        if (!$success) {
            return response()->json(['message' => 'The record was modified by another user. Please refresh.'], 409);
        }

        // 3. Workflow State Machine Logic
        DB::transaction(function () use ($requisition, $step, $request) {
            switch ($request->action) {
                case 'approved':
                    $this->handleApproval($requisition, $step);
                    break;
                case 'rejected':
                    $requisition->update(['status' => 'rejected']);
                    // Optional: Deactivate future steps if any exist
                    $requisition->approvalSteps()->where('action', 'pending')->update(['action' => 'cancelled']);
                    break;
                case 'returned':
                    $requisition->update(['status' => 'returned']);
                    // Cancel all other pending steps so they don't show in inboxes
                    $requisition->approvalSteps()->where('id', '!=', $step->id)->where('action', 'pending')->delete();
                    break;
                case 'on_hold':
                    $requisition->update(['status' => 'on_hold', 'hold_reason' => $request->comment]);
                    break;
            }


            AuditLog::record($requisition, "approval_step_{$step->step_number}_{$request->action}", null, [
                'comment' => $request->comment,
                'step' => $step->step_label
            ]);
        });

        return response()->json(['message' => "Requisition {$request->action} successfully."]);
    }

    private function handleApproval(Requisition $requisition, ApprovalStep $step)
    {
        // Define routing logic based on SOP-03
        if ($step->step_number == 1) { // Dept Head approved -> Procurement
            $requisition->update(['status' => 'under_review']);

            ApprovalStep::create([
                'requisition_id' => $requisition->id,
                'step_number' => 2,
                'step_label' => 'Procurement Review & Canvassing',
                'role_required' => 'proc_officer',
                'sla_deadline' => now()->addHours(48),
            ]);

        } elseif ($step->step_number == 2) { // Proc Officer approved -> For Quoting
            $requisition->update(['status' => 'for_quoting']);
            // Procurement manually adds quotes now

        } elseif ($step->step_number == 3) { // Finance Review (Final Step)
            $requisition->update(['status' => 'approved']);
            // Ready for NTA/PO generation
        }
    }
}
