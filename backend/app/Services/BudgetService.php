<?php

namespace App\Services;

use App\Models\BudgetLedger;
use App\Models\Department;
use App\Models\Requisition;
use App\Models\PurchaseOrder;
use App\Models\PaymentRequest;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class BudgetService
{
    /**
     * Record a pre-encumbrance when a Requisition is submitted.
     */
    public function preEncumber(Requisition $requisition): void
    {
        BudgetLedger::create([
            'department_id' => $requisition->department_id,
            'project_id' => $requisition->project_id,
            'requisition_id' => $requisition->id,
            'type' => 'pre_encumbrance',
            'amount' => $requisition->estimated_total,
            'description' => "PR Submission: {$requisition->title}",
            'reference_number' => $requisition->ref_number,
        ]);
    }

    /**
     * Convert pre-encumbrance to encumbrance when a PO is issued.
     */
    public function encumber(PurchaseOrder $po): void
    {
        DB::transaction(function () use ($po) {
            $requisition = $po->requisition;

            // 1. Reverse the Pre-Encumbrance
            BudgetLedger::create([
                'department_id' => $requisition->department_id,
                'project_id' => $requisition->project_id,
                'requisition_id' => $requisition->id,
                'type' => 'adjustment',
                'amount' => -$requisition->estimated_total,
                'description' => "PO Issued - Releasing PR Pre-Encumbrance",
                'reference_number' => $po->ref_number,
            ]);

            // 2. record the actual PO Encumbrance
            BudgetLedger::create([
                'department_id' => $requisition->department_id,
                'project_id' => $requisition->project_id,
                'requisition_id' => $requisition->id,
                'purchase_order_id' => $po->id,
                'type' => 'encumbrance',
                'amount' => $po->grand_total,
                'description' => "PO Issued: {$requisition->title}",
                'reference_number' => $po->ref_number,
            ]);
        });
    }

    /**
     * record actual spend and reduce encumbrance proportionally.
     */
    public function actualize(PaymentRequest $payment): void
    {
        DB::transaction(function () use ($payment) {
            $po = $payment->purchaseOrder;

            // 1. record the Actual Spend
            BudgetLedger::create([
                'department_id' => $payment->department_id,
                'project_id' => $payment->requisition->project_id ?? null,
                'requisition_id' => $payment->requisition_id,
                'purchase_order_id' => $payment->purchase_order_id,
                'payment_request_id' => $payment->id,
                'type' => 'actual',
                'amount' => $payment->amount,
                'description' => "Payment Approved: {$payment->title}",
                'reference_number' => $payment->ref_number,
            ]);

            // 2. Reduce Encumbrance
            // Note: In a professional P2P, we reduce encumbrance based on what was actually "liquidated"
            if ($po) {
                BudgetLedger::create([
                    'department_id' => $payment->department_id,
                    'project_id' => $payment->requisition->project_id ?? null,
                    'purchase_order_id' => $po->id,
                    'type' => 'adjustment',
                    'amount' => -$payment->amount,
                    'description' => "Payment Liquidation - Reducing PO Encumbrance",
                    'reference_number' => $payment->ref_number,
                ]);
            }
        });
    }

    /**
     * Release funds for rejected/cancelled PRs or POs.
     */
    public function release(Model $entity, string $reason = 'Cancelled'): void
    {
        if ($entity instanceof Requisition) {
            BudgetLedger::create([
                'department_id' => $entity->department_id,
                'project_id' => $entity->project_id,
                'requisition_id' => $entity->id,
                'type' => 'adjustment',
                'amount' => -$entity->estimated_total,
                'description' => "PR $reason - Releasing Funds",
                'reference_number' => $entity->ref_number,
            ]);
        } elseif ($entity instanceof PurchaseOrder) {
            // Find current encumbrance total for this PO to release it fully
            $currentEnc = BudgetLedger::where('purchase_order_id', $entity->id)
                ->whereIn('type', ['encumbrance', 'adjustment'])
                ->sum('amount');

            if ($currentEnc > 0) {
                BudgetLedger::create([
                    'department_id' => $entity->requisition->department_id,
                    'project_id' => $entity->requisition->project_id,
                    'purchase_order_id' => $entity->id,
                    'type' => 'adjustment',
                    'amount' => -$currentEnc,
                    'description' => "PO $reason - Releasing Remaining Encumbrance",
                    'reference_number' => $entity->ref_number,
                ]);
            }
        }
    }

    /**
     * Check if a budget line has sufficient funds.
     */
    public function isBudgetAvailable(string $departmentId, ?string $projectId, float $amount): bool
    {
        $limit = Department::find($departmentId)->budget_limit ?? 0;
        if ($projectId) {
            $limit = Department::find($projectId)->budget_limit ?? 0;
        }

        $consumed = BudgetLedger::where(function ($q) use ($departmentId, $projectId) {
            if ($projectId) {
                $q->where('project_id', $projectId);
            } else {
                $q->where('department_id', $departmentId)->whereNull('project_id');
            }
        })
            ->sum('amount');

        return ($limit - $consumed) >= $amount;
    }
}
