<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApprovalStep;
use App\Models\PaymentApproval;
use App\Services\RequisitionWorkflowService;
use App\Services\PaymentRequestWorkflowService;
use Illuminate\Http\Request;
use Exception;

class ApprovalEmailController extends Controller
{
    /**
     * Handle the signed URL action from an email.
     */
    public function handleAction(
        Request $request,
        $stepId,
        RequisitionWorkflowService $requisitionWorkflow,
        PaymentRequestWorkflowService $paymentWorkflow
    ) {
        // 1. Signature validation happens automatically via middleware 'signed' in routes

        $type = $request->query('type', 'requisition'); // Default to requisition for backward compatibility
        $action = $request->query('action');
        $comment = $action === 'rejected' ? 'Actioned via Email' : null;

        try {
            if ($type === 'payment') {
                $step = PaymentApproval::findOrFail($stepId);
                $entity = $step->paymentRequest;
                $paymentWorkflow->processApprovalAction($step, $action, $comment);
            } else {
                $step = ApprovalStep::findOrFail($stepId);
                $entity = $step->requisition;
                $requisitionWorkflow->processApprovalAction($step, $action, $comment);
            }

            return view('emails.action-success', [
                'requisition' => $entity, // Blade template expects 'requisition' variable name
                'action' => $action,
                'step' => $step
            ]);
        } catch (Exception $e) {
            return view('emails.action-error', ['message' => $e->getMessage()]);
        }
    }
}
