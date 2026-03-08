<?php

namespace App\Services;

use App\Models\Requisition;
use Illuminate\Support\Str;

class SapSimulationService
{
    /**
     * Simulate fetching JO/PO details from SAP.
     * In a live environment, this would call SAP OData or BAPI.
     */
    public function fetchExternalDetails(Requisition $requisition): array
    {
        // Simulate a delay
        // usleep(500000); 

        $isPo = $requisition->request_type === 'purchase_order' || str_contains($requisition->ref_number, 'PR');

        return [
            'external_ref' => ($isPo ? 'SAP-PO-' : 'SAP-JO-') . date('Y') . '-' . rand(10000, 99999),
            'vendor_name' => 'ABC Solutions (SAP Verified)',
            'total_amount' => $requisition->estimated_total,
            'currency' => 'PHP',
            'sap_status' => 'Released',
            'details' => [
                'company_code' => '1000',
                'purchasing_org' => 'PITX',
                'header_text' => 'Generated from Requisition ' . $requisition->ref_number,
            ],
            'items' => $requisition->lineItems->map(fn($item) => [
                'description' => $item->description,
                'quantity' => $item->quantity,
                'unit' => $item->unit,
                'unit_price' => $item->estimated_unit_cost,
                'line_total' => $item->line_total,
            ])
        ];
    }
}
