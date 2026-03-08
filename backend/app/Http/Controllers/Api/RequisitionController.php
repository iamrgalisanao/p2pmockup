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
            'particulars' => 'nullable|string',
            'department_id' => 'required|exists:departments,id',
            'project_id' => 'nullable|exists:departments,id',
            'date_needed' => 'required|date|after:today',
            'priority' => 'nullable|in:normal,urgent',
            'description' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:0.0001',
            'items.*.estimated_unit_cost' => 'required|numeric|min:0',
            'items.*.gl_account_code' => 'nullable|string',
            'items.*.gl_category' => 'nullable|string',
            'items.*.vat_type' => 'nullable|string',
            'items.*.wht_type' => 'nullable|string',
            'funding_source' => 'nullable|string|in:OPEX,CAPEX',
            'checked_by_ids' => 'nullable|array',
        ]);

        $user = $request->user();

        $requisition = DB::transaction(function () use ($request, $user) {
            $dept = \App\Models\Department::find($request->department_id);
            $refNumber = ($request->request_type === 'MRF' || $request->request_type === 'JRF')
                ? Requisition::generateRefNumber($request->request_type, $dept->name)
                : 'PR-' . date('Y') . '-' . strtoupper(Str::random(5));

            $r = Requisition::create([
                'ref_number' => $refNumber,
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
                'funding_source' => $request->funding_source,
                'checked_by_ids' => $request->checked_by_ids,
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
            'particulars' => 'nullable|string',
            'date_needed' => 'sometimes|date|after:today',
            'priority' => 'nullable|in:normal,urgent',
            'description' => 'nullable|string',
            'items' => 'sometimes|array|min:1',
            'items.*.description' => 'sometimes|required|string',
            'items.*.quantity' => 'sometimes|required|numeric|min:0.0001',
            'items.*.estimated_unit_cost' => 'sometimes|required|numeric|min:0',
            'items.*.gl_account_code' => 'nullable|string',
            'items.*.gl_category' => 'nullable|string',
            'items.*.vat_type' => 'nullable|string',
            'items.*.wht_type' => 'nullable|string',
            'funding_source' => 'sometimes|nullable|string|in:OPEX,CAPEX',
            'checked_by_ids' => 'sometimes|nullable|array',
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
                'description',
                'funding_source',
                'checked_by_ids'
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

    public function submit(Requisition $requisition, \App\Services\RequisitionWorkflowService $workflow)
    {
        $this->authorizeScope($requisition);

        try {
            $workflow->transition($requisition, 'submitted');
            return response()->json(['message' => 'Requisition submitted for processing.', 'requisition' => $requisition]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Simulation: Fetch JO/PO details from SAP (R-12)
     */
    public function fetchSapDetails(Requisition $requisition, \App\Services\SapSimulationService $sap)
    {
        $this->authorizeScope($requisition);

        if ($requisition->status !== 'for_sap_entry') {
            return response()->json(['message' => 'Requisition is not yet ready for SAP verification.'], 422);
        }

        $details = $sap->fetchExternalDetails($requisition);

        return response()->json($details);
    }

    /**
     * Confirm/Verify details of JO/PO from SAP
     */
    public function verifySapDetails(Request $request, Requisition $requisition, \App\Services\RequisitionWorkflowService $workflow)
    {
        $this->authorizeScope($requisition);

        $request->validate([
            'external_sap_ref' => 'required|string',
        ]);

        try {
            DB::transaction(function () use ($request, $requisition, $workflow) {
                $requisition->update([
                    'external_sap_ref' => $request->external_sap_ref,
                    'sap_verified_at' => now(),
                    'sap_verified_by' => auth()->id(),
                ]);

                $workflow->transition($requisition, 'sap_verified');
            });

            return response()->json(['message' => 'SAP details verified. Approval workflow started.', 'requisition' => $requisition]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * R-13: Reactivate a cancelled requisition.
     */
    public function reactivate(Requisition $requisition, \App\Services\RequisitionWorkflowService $workflow)
    {
        $this->authorizeScope($requisition);

        // Check Budget Availability (Hard Stop) from remote logic
        $budgetService = new \App\Services\BudgetService();
        if (!$budgetService->isBudgetAvailable($requisition->department_id, $requisition->project_id, (float) $requisition->estimated_total)) {
            return response()->json(['message' => 'Insufficient budget for this requisition.'], 422);
        }

        try {
            $newRequisition = $workflow->reactivate($requisition);
            return response()->json([
                'message' => 'Requisition reactivated successfully.',
                'new_id' => $newRequisition->id,
                'new_ref_number' => $newRequisition->ref_number
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function nextRefNumber(Request $request)
    {
        $request->validate([
            'type' => 'required|string|in:MRF,JRF,PO_ITEM,NON_PO_ITEM',
            'department_id' => 'required|exists:departments,id',
        ]);

        $dept = \App\Models\Department::find($request->department_id);
        $ref = Requisition::generateRefNumber($request->type, $dept->name);

        return response()->json(['ref_number' => $ref]);
    }

    private function authorizeScope(Requisition $r)
    {
        if (!auth()->user()->canSeeRequisition($r)) {
            abort(403, 'Unauthorized access to this requisition.');
        }
    }
}
