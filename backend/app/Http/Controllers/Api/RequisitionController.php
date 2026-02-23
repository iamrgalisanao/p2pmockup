<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Requisition;
use App\Models\AuditLog;
use App\Models\ApprovalStep;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RequisitionController extends Controller
{
    public function index(Request $request)
    {
        // Re-use logic from Dashboard or implement specifically
        return (new DashboardController())->index($request);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'request_type' => 'required|string',
            'cost_center' => 'required|string',
            'particulars' => 'required|string',
            'department_id' => 'required|exists:departments,id',
            'project_id' => 'nullable|exists:departments,id',
            'date_needed' => 'required|date|after:today',
            'priority' => 'required|in:normal,urgent',
            'description' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:0.0001',
            'items.*.estimated_unit_cost' => 'required|numeric|min:0',
            'items.*.gl_account_code' => 'nullable|string',
            'items.*.gl_category' => 'nullable|string',
            'items.*.vat_type' => 'nullable|string',
            'items.*.wht_type' => 'nullable|string',
        ]);

        $user = $request->user();

        $requisition = DB::transaction(function () use ($request, $user) {
            $r = Requisition::create([
                'ref_number' => 'PR-' . date('Y') . '-' . strtoupper(Str::random(5)),
                'title' => $request->title,
                'request_type' => $request->request_type,
                'po_number' => $request->po_number,
                'particulars' => $request->particulars,
                'cost_center' => $request->cost_center,
                'department_id' => $request->department_id,
                'project_id' => $request->project_id,
                'requested_by' => $user->id,
                'date_needed' => $request->date_needed,
                'priority' => $request->priority,
                'description' => $request->description,
                'status' => 'draft',
                'version' => 1,
            ]);

            foreach ($request->items as $index => $item) {
                $r->lineItems()->create([
                    'description' => $item['description'],
                    'specification' => $item['specification'] ?? null,
                    'gl_account_code' => $item['gl_account_code'] ?? null,
                    'gl_category' => $item['gl_category'] ?? null,
                    'vat_type' => $item['vat_type'] ?? '12% VAT',
                    'wht_type' => $item['wht_type'] ?? 'None (X1)',
                    'unit' => $item['unit'] ?? 'pcs',
                    'quantity' => $item['quantity'],
                    'estimated_unit_cost' => $item['estimated_unit_cost'],
                    'sort_order' => $index,
                ]);
            }

            AuditLog::record($r, 'created', null, $r->toArray());

            return $r;
        });

        return response()->json($requisition->load(['department', 'project', 'lineItems']), 201);
    }

    public function show(Requisition $requisition)
    {
        $this->authorizeScope($requisition);

        return response()->json($requisition->load([
            'department',
            'project',
            'requester',
            'lineItems',
            'attachments',
            'approvalSteps.approver',
            'quotes.vendor',
            'noticeToAward',
            'purchaseOrder'
        ]));
    }

    public function update(Request $request, Requisition $requisition)
    {
        $this->authorizeScope($requisition);

        if ($requisition->status !== 'draft' && $requisition->status !== 'returned') {
            return response()->json(['message' => 'Only drafts or returned requisitions can be edited.'], 422);
        }

        $request->validate([
            'title' => 'sometimes|string|max:255',
            'request_type' => 'sometimes|string',
            'cost_center' => 'sometimes|string',
            'particulars' => 'sometimes|string',
            'date_needed' => 'sometimes|date|after:today',
            'priority' => 'sometimes|in:normal,urgent',
            'description' => 'nullable|string',
            'items' => 'sometimes|array|min:1',
            'items.*.description' => 'sometimes|required|string',
            'items.*.quantity' => 'sometimes|required|numeric|min:0.0001',
            'items.*.estimated_unit_cost' => 'sometimes|required|numeric|min:0',
            'items.*.gl_account_code' => 'nullable|string',
            'items.*.gl_category' => 'nullable|string',
            'items.*.vat_type' => 'nullable|string',
            'items.*.wht_type' => 'nullable|string',
        ]);

        $before = $requisition->toArray();

        DB::transaction(function () use ($request, $requisition) {
            $requisition->update($request->only([
                'title',
                'request_type',
                'po_number',
                'particulars',
                'cost_center',
                'date_needed',
                'priority',
                'description'
            ]));

            if ($request->has('items')) {
                $incomingItemIds = collect($request->items)->pluck('id')->filter()->toArray();

                // Delete items not in incoming list
                $requisition->lineItems()->whereNotIn('id', $incomingItemIds)->delete();

                foreach ($request->items as $index => $item) {
                    $requisition->lineItems()->updateOrCreate(
                        ['id' => $item['id'] ?? Str::uuid()->toString()],
                        [
                            'description' => $item['description'],
                            'specification' => $item['specification'] ?? null,
                            'gl_account_code' => $item['gl_account_code'] ?? null,
                            'gl_category' => $item['gl_category'] ?? null,
                            'vat_type' => $item['vat_type'] ?? '12% VAT',
                            'wht_type' => $item['wht_type'] ?? 'None (X1)',
                            'unit' => $item['unit'] ?? 'pcs',
                            'quantity' => $item['quantity'],
                            'estimated_unit_cost' => $item['estimated_unit_cost'],
                            'sort_order' => $index,
                        ]
                    );
                }
            }
        });

        AuditLog::record($requisition, 'updated', $before, $requisition->toArray());

        return response()->json($requisition->load('lineItems'));
    }

    public function submit(Requisition $requisition)
    {
        $this->authorizeScope($requisition);

        if ($requisition->status !== 'draft' && $requisition->status !== 'returned') {
            return response()->json(['message' => 'Requisition must be in draft or returned status to submit.'], 422);
        }

        if ($requisition->lineItems()->count() === 0) {
            return response()->json(['message' => 'Requisition must have at least one line item.'], 422);
        }

        // Checklist enforcement (logic defined in SOP-02)
        // For Phase 1, we assume specific docs are required
        $requiredDocs = ['purchase_request_form']; // Example
        $requisition->updateChecklistStatus($requiredDocs);

        // TEMPORARY: Allow submission for mockup even if docs not physically attached
        /*
        if (!$requisition->checklist_satisfied) {
            return response()->json(['message' => 'Required documents are missing.'], 422);
        }
        */

        DB::transaction(function () use ($requisition) {
            $requisition->status = 'submitted';
            $requisition->save();

            // Clear any old/existing steps if re-submitting from returned/draft
            $requisition->approvalSteps()->delete();

            $stepNumber = 1;


            // 1. Dept Head
            ApprovalStep::create([
                'requisition_id' => $requisition->id,
                'step_number' => $stepNumber++,
                'step_label' => 'Department Head Approval',
                'role_required' => 'dept_head',
                'sla_deadline' => now()->addHours(24),
            ]);

            AuditLog::record($requisition, 'submitted');
        });

        return response()->json(['message' => 'Requisition submitted for approval.', 'requisition' => $requisition]);
    }

    private function authorizeScope(Requisition $r)
    {
        if (!auth()->user()->canSeeRequisition($r)) {
            abort(403, 'Unauthorized access to this requisition.');
        }
    }
}
