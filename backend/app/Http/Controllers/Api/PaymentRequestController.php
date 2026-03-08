<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentRequest;
use App\Services\PaymentRequestWorkflowService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Exception;

class PaymentRequestController extends Controller
{
    protected $workflowService;

    public function __construct(PaymentRequestWorkflowService $workflowService)
    {
        $this->workflowService = $workflowService;
    }

    public function index(Request $request)
    {
        $query = PaymentRequest::with(['department', 'requester'])
            ->orderBy('created_at', 'desc');

        // RBAC: Strict Department Scoping (R-03)
        // Note: Global Scope 'DepartmentScope' should be applied to model soon
        // For now, we manually apply if not admin/global roles
        $user = Auth::user();
        if (!in_array($user->role, ['admin', 'president', 'accounting_manager'])) {
            $query->where(function ($q) use ($user) {
                $q->where('department_id', $user->department_id)
                    ->orWhere('requested_by', $user->id);
            });
        }

        if ($request->filled('status')) {
            $statuses = is_array($request->status) ? $request->status : [$request->status];
            $query->whereIn('status', $statuses);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('ref_number', 'like', "%$s%")
                    ->orWhereHas('requester', fn($rq) => $rq->where('name', 'like', "%$s%"))
                    ->orWhereHas('requisition', function ($rq) use ($s) {
                        $rq->where('ref_number', 'like', "%$s%")
                            ->orWhere('title', 'like', "%$s%");
                    });
            });
        }

        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = $request->input('sort_dir', 'desc');
        $allowedSorts = ['created_at', 'ref_number', 'status', 'amount'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->reorder($sortBy, $sortDir);
        }

        return response()->json($query->paginate($request->input('per_page', 20)));
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'request_type' => 'required|in:po_based,non_po,reimbursement,cash_advance',
            'amount' => 'required|numeric|min:0',
            'due_date' => 'required|date',
            'department_id' => 'required|exists:departments,id',
            'items' => 'required|array|min:1',
            'po_jo_id' => 'nullable|exists:purchase_orders,id',
        ]);

        try {
            return \DB::transaction(function () use ($request) {
                $paymentRequest = PaymentRequest::create([
                    'ref_number' => 'RFP-' . date('Ymd') . '-' . strtoupper(\Str::random(5)),
                    'title' => $request->title,
                    'request_type' => $request->request_type,
                    'requisition_id' => $request->requisition_id,
                    'po_jo_id' => $request->po_jo_id,
                    'amount' => $request->amount,
                    'due_date' => $request->due_date,
                    'department_id' => $request->department_id,
                    'payee_name' => $request->payee_name ?? 'Unknown',
                    'vendor_id' => $request->vendor_id,
                    'cost_center' => $request->cost_center,
                    'particulars' => $request->particulars,
                    'requested_by' => Auth::id(),
                    'status' => 'draft'
                ]);

                foreach ($request->items as $item) {
                    $paymentRequest->lineItems()->create($item);
                }

                return response()->json($paymentRequest, 201);
            });
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function show(PaymentRequest $paymentRequest)
    {
        return response()->json($paymentRequest->load([
            'lineItems',
            'approvals.approver',
            'department',
            'requester',
            'poJo',
            'accountingValidator'
        ]));
    }

    public function submit(PaymentRequest $paymentRequest)
    {
        try {
            $this->workflowService->submit($paymentRequest);
            return response()->json($paymentRequest);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    /**
     * Accounting validation gate (Rule R-14).
     */
    public function accountingValidate(Request $request, PaymentRequest $paymentRequest)
    {
        // Only Accounting roles can validate
        $user = Auth::user();
        if (!in_array($user->role, ['admin', 'accounting_staff', 'accounting_supervisor', 'accounting_manager'])) {
            return response()->json(['error' => 'Only accounting personnel can validate RFPs.'], 403);
        }

        try {
            $this->workflowService->validateByAccounting($paymentRequest);
            return response()->json(['message' => 'RFP validated by accounting. Approval workflow triggered.']);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function act(Request $request, PaymentRequest $paymentRequest, \App\Models\PaymentApproval $step)
    {
        $request->validate([
            'action' => 'required|in:approved,rejected,returned,on_hold',
            'comment' => 'nullable|string'
        ]);

        try {
            // Verify role
            if (Auth::user()->role !== $step->role_required && Auth::user()->role !== 'admin') {
                return response()->json(['error' => 'Unauthorized role for this step.'], 403);
            }

            $this->workflowService->processApprovalAction($step, $request->action, $request->comment);
            return response()->json(['message' => 'Action recorded successfully.']);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }
}
