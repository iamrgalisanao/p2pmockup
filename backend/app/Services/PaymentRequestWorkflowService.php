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

            // Notify Requester
            if ($oldStatus !== $newStatus && $newStatus !== 'draft' && $paymentRequest->requestedBy) {
                Mail::to($paymentRequest->requestedBy->email)->send(
                    new \App\Mail\PaymentRequestStatusNotification($paymentRequest, $oldStatus, $newStatus, $options['comment'] ?? null)
                );
            }

            return $paymentRequest;
        });
    }

    public function submit(PaymentRequest $paymentRequest)
    {
        return DB::transaction(function () use ($paymentRequest) {
            if ($paymentRequest->status !== 'draft') {
                throw new Exception("Only draft requests can be submitted.");
            }

            if ($paymentRequest->lineItems()->count() === 0) {
                throw new Exception("Payment Request must have at least one item.");
            }

            // Move to accounting_validated gate (Rule R-14)
            $this->transition($paymentRequest, 'accounting_validated');

            return $paymentRequest;
        });
    }

    /**
     * Accounting validation gate. Starts the approval chain.
     */
    public function validateByAccounting(PaymentRequest $paymentRequest, array $options = [])
    {
        return DB::transaction(function () use ($paymentRequest, $options) {
            if ($paymentRequest->status !== 'accounting_validated') {
                throw new Exception("Payment Request must be in 'accounting_validated' state.");
            }

            $user = Auth::user();

            $paymentRequest->update([
                'accounting_validated_by' => $user->id,
                'accounting_validated_at' => now(),
                'status' => 'under_review'
            ]);

            // 1. Generate Approval Chain
            $this->generateApprovalChain($paymentRequest);

            // 2. Notify First Approver
            $this->notifyNextApprover($paymentRequest);

            // 3. Log Audit
            AuditLog::record($paymentRequest, 'accounting_validated', null, [
                'user_id' => $user->id
            ]);

            return $paymentRequest;
        });
    }

    /**
     * Generate the approval chain for Payment Requests.
     */
    private function generateApprovalChain(PaymentRequest $paymentRequest)
    {
        // Clear existing steps
        $paymentRequest->approvals()->delete();

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

            // Record Actual Spend in Budget Ledger
            $budgetService = new \App\Services\BudgetService();
            $budgetService->actualize($paymentRequest);
        } else {
            // Notify next approver sequentially
            $this->notifyNextApprover($paymentRequest);
        }
    }

    /**
     * Finds the next pending approval step and notifies the relevant users.
     */
    private function notifyNextApprover(PaymentRequest $paymentRequest)
    {
        $nextStep = $paymentRequest->approvals()
            ->where('action', 'pending')
            ->orderBy('step_number')
            ->first();

        if (!$nextStep) {
            return;
        }

        // Find users with the required role
        $approvers = \App\Models\User::where('role', $nextStep->role_required)
            ->where('is_active', true)
            ->where(function ($q) use ($paymentRequest) {
                // Respect department scoping
                $q->where('department_id', $paymentRequest->department_id)
                    ->orWhere('role', 'admin')
                    ->orWhere('role', 'president');
            })
            ->get();

        foreach ($approvers as $user) {
            Mail::to($user->email)->send(new \App\Mail\PaymentRequestApproverNotification($paymentRequest, $nextStep));
        }

        AuditLog::record($paymentRequest, 'approver_notified', null, [
            'step' => $nextStep->step_label,
            'role' => $nextStep->role_required
        ]);
    }
}
