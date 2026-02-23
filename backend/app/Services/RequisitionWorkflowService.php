<?php

namespace App\Services;

use App\Models\Requisition;
use App\Models\ApprovalStep;
use App\Models\AuditLog;
use App\Models\NoticeToAward;
use App\Models\VendorQuote;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use App\Mail\StatusChangeNotification;
use Exception;

class RequisitionWorkflowService
{
    /**
     * Transition a requisition to a new status with validation guards.
     * 
     * @param Requisition $requisition
     * @param string $newStatus
     * @param array $options
     * @return Requisition
     * @throws Exception
     */
    public function transition(Requisition $requisition, string $newStatus, array $options = [])
    {
        return DB::transaction(function () use ($requisition, $newStatus, $options) {
            // 1. Optimistic Locking check
            if (isset($options['version']) && $requisition->version !== (int) $options['version']) {
                throw new Exception("Concurrency Error: Requisition was modified by another user. Please refresh.");
            }

            $oldStatus = $requisition->status;
            $user = Auth::user();

            // 2. State-specific Guards
            $this->validateTransition($requisition, $newStatus);

            // 3. Status-specific Logic
            switch ($newStatus) {
                case 'submitted':
                    $this->handleSubmission($requisition);
                    break;
                case 'on_hold':
                    $requisition->sla_paused = true;
                    $requisition->sla_paused_at = Carbon::now();
                    $requisition->hold_reason = $options['comment'] ?? 'Admin hold';
                    break;
                case 'under_review':
                case 'for_quoting':
                case 'quote_evaluation':
                case 'for_approval':
                case 'approved':
                case 'awarded':
                case 'po_issued':
                    // Resume SLA if coming from hold
                    if ($oldStatus === 'on_hold') {
                        $requisition->resumeSla();
                    }
                    break;
            }

            // 4. Perform Transition
            $requisition->status = $newStatus;
            $requisition->version += 1;
            $requisition->save();

            // 5. Log Audit Trail
            AuditLog::record($requisition, "status_changed", ['from' => $oldStatus, 'to' => $newStatus], [
                'comment' => $options['comment'] ?? null,
                'user_id' => $user?->id
            ]);

            // 6. Notify Requester
            if ($oldStatus !== $newStatus && $newStatus !== 'draft' && $requisition->creator) {
                Mail::to($requisition->creator)->send(
                    new StatusChangeNotification($requisition, $oldStatus, $newStatus, $options['comment'] ?? null)
                );
            }

            return $requisition;
        });
    }

    /**
     * Validate if a transition is allowed based on guards.
     */
    private function validateTransition(Requisition $requisition, string $newStatus)
    {
        $current = $requisition->status;

        if ($current === 'cancelled' || $current === 'closed') {
            throw new Exception("Cannot transition from immutable state: {$current}");
        }

        switch ($newStatus) {
            case 'submitted':
                // Check if all required docs are satisfied
                if (!$requisition->checklist_satisfied) {
                    throw new Exception("Submission blocked: Required documents are missing based on the checklist.");
                }
                if ($requisition->lineItems()->count() === 0) {
                    throw new Exception("Submission blocked: Requisition must have at least one item.");
                }
                break;

            case 'quote_evaluation':
            case 'for_approval':
                // ≥3 vendor quotes required (R-09)
                if ($requisition->responsiveQuoteCount() < 3 && !($requisition->auditLogs()->where('event', 'quote_exception_approved')->exists())) {
                    throw new Exception("Rule R-09: At least 3 responsive vendor quotes (complete & compliant) are required to proceed to evaluation/approval.");
                }
                break;

            case 'awarded':
                if (!$requisition->quotes()->where('is_awarded', true)->exists()) {
                    throw new Exception("Award transition blocked: No vendor has been selected.");
                }
                break;
        }
    }

    /**
     * Logic for when a PR is first submitted.
     */
    private function handleSubmission(Requisition $requisition)
    {
        // 1. Clear old steps (in case of re-submission from 'returned')
        $requisition->approvalSteps()->delete();

        // 2. Generate Approval Chain (SOP-03)
        $stepNumber = 1;

        // Step 1: Dept Head
        ApprovalStep::create([
            'requisition_id' => $requisition->id,
            'step_number' => $stepNumber++,
            'step_label' => 'Department Head Approval',
            'role_required' => 'dept_head',
            'sla_deadline' => Carbon::now()->addHours(24),
        ]);

        // Step 2: High Value Check (> 1M)
        if ($requisition->estimated_total > 1000000) {
            ApprovalStep::create([
                'requisition_id' => $requisition->id,
                'step_number' => $stepNumber++,
                'step_label' => 'President/CEA Approval',
                'role_required' => 'president',
                'sla_deadline' => Carbon::now()->addHours(48),
            ]);
        }

        // Step 3-5: Accounting Chain
        $accountingSteps = [
            ['label' => 'Accounting Staff - Documentation Check', 'role' => 'accounting_staff'],
            ['label' => 'Accounting Supervisor - Budget Review', 'role' => 'accounting_supervisor'],
            ['label' => 'Accounting Manager - Final Endorsement', 'role' => 'accounting_manager'],
        ];

        foreach ($accountingSteps as $s) {
            ApprovalStep::create([
                'requisition_id' => $requisition->id,
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
    public function processApprovalAction(ApprovalStep $step, string $action, ?string $comment = null)
    {
        return DB::transaction(function () use ($step, $action, $comment) {
            $requisition = $step->requisition;
            $user = Auth::user();

            // 1. Perform static action on step model (concurrency safe)
            $success = $step->performAction($action, $comment, $user);
            if (!$success) {
                throw new Exception("Action failed: Step was already actioned or record was modified.");
            }

            // 2. Handle Workflow State Changes
            switch ($action) {
                case 'approved':
                    $this->handleStepApproval($requisition, $step);
                    break;
                case 'rejected':
                    $this->transition($requisition, 'rejected', ['comment' => $comment]);
                    // Mark subsequent steps as cancelled
                    $requisition->approvalSteps()->where('action', 'pending')->update(['action' => 'cancelled']);
                    break;
                case 'returned':
                    $this->transition($requisition, 'returned', ['comment' => $comment]);
                    // Delete pending steps so they can be regenerated on re-submit
                    $requisition->approvalSteps()->where('action', 'pending')->delete();
                    break;
                case 'on_hold':
                    $this->transition($requisition, 'on_hold', ['comment' => $comment]);
                    break;
            }

            return true;
        });
    }

    private function handleStepApproval(Requisition $requisition, ApprovalStep $step)
    {
        $lastStep = $requisition->approvalSteps()->orderByDesc('step_number')->first();

        // If this was the last step in the current chain, move PR status forward
        if ($step->id === $lastStep->id) {
            // Logic for what happens after all approvers are done
            // Based on SOP-01: Approved -> (Evaluation/Award)
            $this->transition($requisition, 'approved');
        }
    }

    /**
     * Award a requisition to a specific vendor quote.
     */
    public function awardVendor(Requisition $requisition, VendorQuote $quote, array $options = [])
    {
        return DB::transaction(function () use ($requisition, $quote, $options) {
            // 1. Validation
            if ($requisition->status !== 'approved') {
                throw new Exception("Requisition must be 'approved' before awarding.");
            }

            if (!$quote->isResponsive()) {
                throw new Exception("Cannot award to an incomplete or non-compliant quote.");
            }

            // 1.5. Enforce R-09 (Rule of 3 Responsive Quotes)
            $responsiveCount = $requisition->quotes()->where('is_complete', true)->count();
            $hasException = AuditLog::where('entity_type', 'Requisition')
                ->where('entity_id', $requisition->id)
                ->where('action', 'quote_exception_approved')
                ->exists();

            if ($responsiveCount < 3 && !$hasException) {
                throw new Exception("Rule R-09 Violation: At least 3 responsive vendor quotes are required to award, unless an exception is logged.");
            }

            // 2. Enforce R-10 (Lowest Responsive Bid)
            $lowest = $requisition->lowestQuote();
            $isLowest = ($lowest && $quote->id === $lowest->id);
            $basis = $isLowest ? 'lowest_responsive_bid' : 'authorized_override';

            if (!$isLowest && empty(trim($options['justification'] ?? ''))) {
                throw new Exception("Rule R-10: Justification is required when NOT awarding to the lowest responsive bid.");
            }

            // 3. Update Quote Status
            $requisition->quotes()->update(['is_awarded' => false]); // Reset others
            $quote->update(['is_awarded' => true]);

            // 4. Create Notice to Award (NTA)
            $nta = NoticeToAward::create([
                'ref_number' => 'NTA-' . date('Y') . '-' . Str::random(5),
                'requisition_id' => $requisition->id,
                'vendor_id' => $quote->vendor_id,
                'awarded_quote_id' => $quote->id,
                'award_basis' => $basis,
                'override_justification' => $isLowest ? null : $options['justification'],
                'issued_by' => Auth::id(),
                'issued_at' => Carbon::now(),
                'status' => 'issued',
            ]);

            // 5. Transition Requisition
            $this->transition($requisition, 'awarded', [
                'comment' => "Awarded to {$quote->vendor->name} via {$basis}."
            ]);

            return $nta;
        });
    }
    /**
     * Mark PO/JO as sent to vendor.
     */
    public function markSent(Requisition $requisition, string $type)
    {
        return DB::transaction(function () use ($requisition, $type) {
            if ($type === 'nta') {
                $doc = $requisition->noticeToAward;
                if (!$doc)
                    throw new Exception("NTA not found.");
                $doc->update(['status' => 'mark_sent', 'sent_at' => now()]);
                AuditLog::record($requisition, "nta_marked_as_sent");
            } else {
                $doc = $requisition->purchaseOrder;
                if (!$doc)
                    throw new Exception("PO/JO not found.");
                $doc->update(['status' => 'mark_sent', 'sent_at' => now()]);

                // If it's the first time marking as sent, move PR status to po_issued (safeguard)
                if ($requisition->status === 'awarded') {
                    $this->transition($requisition, 'po_issued');
                }

                AuditLog::record($requisition, "po_marked_as_sent");
            }
            return true;
        });
    }

    /**
     * Transition PR to 'completed' (Fulfillment done).
     */
    public function completeFulfillment(Requisition $requisition, string $comment = '')
    {
        return DB::transaction(function () use ($requisition, $comment) {
            if ($requisition->status !== 'po_issued') {
                throw new Exception("Requisition must be in 'po_issued' state before completion.");
            }

            if ($requisition->purchaseOrder) {
                $requisition->purchaseOrder->update(['status' => 'completed']);
            }

            $this->transition($requisition, 'completed', ['comment' => $comment]);
            return true;
        });
    }
}
