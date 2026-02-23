<?php

namespace App\Services;

use App\Models\PaymentRequest;
use App\Models\PaymentApproval;
use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Carbon;
use App\Mail\StatusChangeNotification;
use Exception;

class PaymentRequestWorkflowService
{
    /**
     * Transition a payment request to a new status.
     */
    public function transition(PaymentRequest $paymentRequest, string $newStatus, array $options = [])
    {
        return DB::transaction(function () use ($paymentRequest, $newStatus, $options) {
            if (isset($options['version']) && $paymentRequest->version !== (int) $options['version']) {
                throw new Exception("Concurrency Error: Record was modified by another user.");
            }

            $oldStatus = $paymentRequest->status;
            $user = Auth::user();

            // Perform Transition
            $paymentRequest->status = $newStatus;
            $paymentRequest->version += 1;
            $paymentRequest->save();

            // Log Audit Trail
            AuditLog::record($paymentRequest, "status_changed", ['from' => $oldStatus, 'to' => $newStatus], [
                'comment' => $options['comment'] ?? null,
                'user_id' => $user?->id
            ]);

            // Notify Requester (Stub for now, reuse existing notification)
            // if ($oldStatus !== $newStatus && $newStatus !== 'draft' && $paymentRequest->requester) {
            //     Mail::to($paymentRequest->requester)->send(
            //         new StatusChangeNotification($paymentRequest, $oldStatus, $newStatus, $options['comment'] ?? null)
            //     );
            // }

            return $paymentRequest;
        });
    }

    /**
     * Handle initial submission of a Payment Request.
     */
    public function submit(PaymentRequest $paymentRequest)
    {
        return DB::transaction(function () use ($paymentRequest) {
            if ($paymentRequest->status !== 'draft') {
                throw new Exception("Only draft requests can be submitted.");
            }

            if ($paymentRequest->lineItems()->count() === 0) {
                throw new Exception("Requisition must have at least one item.");
            }

            // Generate Approval Chain
            $this->generateApprovalChain($paymentRequest);

            $this->transition($paymentRequest, 'submitted');

            return $paymentRequest;
        });
    }

    /**
     * Generate the approval chain for Payment Requests.
     */
    private function generateApprovalChain(PaymentRequest $paymentRequest)
    {
        // Clear existing pending/cancelled steps
        $paymentRequest->approvals()->where('action', 'pending')->delete();

        $stepNumber = 1;

        // Step 1: Dept Head
        PaymentApproval::create([
            'payment_request_id' => $paymentRequest->id,
            'step_number' => $stepNumber++,
            'step_label' => 'Department Head Approval',
            'role_required' => 'dept_head',
            'sla_deadline' => Carbon::now()->addHours(24),
        ]);

        // Step 2: High Value check (> 1M)
        if ($paymentRequest->amount > 1000000) {
            PaymentApproval::create([
                'payment_request_id' => $paymentRequest->id,
                'step_number' => $stepNumber++,
                'step_label' => 'President/CEA Approval',
                'role_required' => 'president',
                'sla_deadline' => Carbon::now()->addHours(48),
            ]);
        }

        // Step 3-5: Accounting Triple-Gate
        $accountingSteps = [
            ['label' => 'Accounting Staff - Documentation Check', 'role' => 'accounting_staff'],
            ['label' => 'Accounting Supervisor - Budget Review', 'role' => 'accounting_supervisor'],
            ['label' => 'Accounting Manager - Final Endorsement', 'role' => 'accounting_manager'],
        ];

        foreach ($accountingSteps as $s) {
            PaymentApproval::create([
                'payment_request_id' => $paymentRequest->id,
                'step_number' => $stepNumber++,
                'step_label' => $s['label'],
                'role_required' => $s['role'],
                'sla_deadline' => Carbon::now()->addHours(24),
            ]);
        }
    }

    /**
     * Process an action on a specific approval step.
     */
    public function processApprovalAction(PaymentApproval $step, string $action, ?string $comment = null)
    {
        return DB::transaction(function () use ($step, $action, $comment) {
            $paymentRequest = $step->paymentRequest;
            $user = Auth::user();

            $success = $step->performAction($action, $comment, $user);
            if (!$success) {
                throw new Exception("Action failed: Step was already actioned.");
            }

            switch ($action) {
                case 'approved':
                    $this->handleStepApproval($paymentRequest, $step);
                    break;
                case 'rejected':
                    $this->transition($paymentRequest, 'rejected', ['comment' => $comment]);
                    $paymentRequest->approvals()->where('action', 'pending')->update(['action' => 'cancelled']);
                    break;
                case 'returned':
                    $this->transition($paymentRequest, 'returned', ['comment' => $comment]);
                    $paymentRequest->approvals()->where('action', 'pending')->delete();
                    break;
            }

            return true;
        });
    }

    private function handleStepApproval(PaymentRequest $paymentRequest, PaymentApproval $step)
    {
        $lastStep = $paymentRequest->approvals()->orderByDesc('step_number')->first();

        if ($step->id === $lastStep->id) {
            $this->transition($paymentRequest, 'approved');
        }
    }
}
