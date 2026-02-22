<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Requisition;
use App\Exports\RequisitionExport;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    /**
     * GET /api/reports/export
     */
    public function export(Request $request)
    {
        $user = $request->user();
        $filename = 'requisitions_export_' . date('Y-m-d_His') . '.xlsx';

        return Excel::download(new RequisitionExport($user->id, $user->role), $filename);
    }

    /**
     * GET /api/reports/requisitions/{requisition}/export
     */
    public function exportSingle(Request $request, Requisition $requisition)
    {
        $user = $request->user();

        if (!$user->canSeeRequisition($requisition)) {
            abort(403, 'Unauthorized access to this requisition.');
        }

        $filename = 'requisition_' . $requisition->ref_number . '.xlsx';

        return Excel::download(new RequisitionExport($user->id, $user->role, $requisition->id), $filename);
    }

    /**
     * GET /api/reports/cost-comparison/{requisition}
     */
    public function costComparison(Requisition $requisition)
    {
        $comparison = $requisition->quotes()
            ->with(['vendor', 'lineItems.requisitionLineItem'])
            ->get()
            ->map(function ($quote) {
                return [
                    'vendor' => $quote->vendor->name,
                    'is_awarded' => $quote->is_awarded,
                    'grand_total' => $quote->grand_total,
                    'is_complete' => $quote->is_complete,
                    'items' => $quote->lineItems->map(function ($item) {
                        return [
                            'description' => $item->requisitionLineItem->description,
                            'unit_price' => $item->unit_price,
                            'total' => $item->line_total
                        ];
                    })
                ];
            });

        return response()->json([
            'requisition_ref' => $requisition->ref_number,
            'summary' => $comparison
        ]);
    }
}
