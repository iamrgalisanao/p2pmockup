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

        // RBAC: Non-admins/Accounting only see their own or their dept's requests
        $user = Auth::user();
        if (!in_array($user->role, ['admin', 'accounting_manager', 'accounting_supervisor', 'accounting_staff', 'president'])) {
            $query->where('requested_by', $user->id)
                ->orWhere('department_id', $user->department_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->paginate(20));
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
        ]);

        try {
            return \DB::transaction(function () use ($request) {
                $paymentRequest = PaymentRequest::create([
                    'ref_number' => 'RF-' . date('Ymd') . '-' . strtoupper(\Str::random(5)),
                    'title' => $request->title,
                    'request_type' => $request->request_type,
                    'requisition_id' => $request->requisition_id,
                    'purchase_order_id' => $request->purchase_order_id,
                    'amount' => $request->amount,
                    'due_date' => $request->due_date,
                    'department_id' => $request->department_id,
                    'payee_name' => $request->payee_name ?? 'Unknown',
                    'vendor_id' => $request->vendor_id,
                    'cost_center' => $request->cost_center,
                    'particulars' => $request->particulars,
                    'requested_by' => Auth::id(),
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
        return response()->json($paymentRequest->load(['lineItems', 'approvals.actor', 'department', 'requester']));
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
