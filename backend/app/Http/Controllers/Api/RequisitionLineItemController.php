<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Requisition;
use App\Models\RequisitionLineItem;
use Illuminate\Http\Request;

class RequisitionLineItemController extends Controller
{
    /**
     * POST /api/requisitions/{requisition}/line-items
     */
    public function store(Request $request, Requisition $requisition)
    {
        if ($requisition->status !== 'draft' && $requisition->status !== 'returned') {
            return response()->json(['message' => 'Line items can only be modified in draft or returned status.'], 422);
        }

        $request->validate([
            'description' => 'required|string',
            'unit' => 'required|string',
            'quantity' => 'required|numeric|min:0.0001',
            'estimated_unit_cost' => 'required|numeric|min:0',
        ]);

        $item = $requisition->lineItems()->create($request->all());

        return response()->json($item, 201);
    }

    public function update(Request $request, Requisition $requisition, RequisitionLineItem $line_item)
    {
        if ($requisition->status !== 'draft' && $requisition->status !== 'returned') {
            return response()->json(['message' => 'Line items can only be modified in draft or returned status.'], 422);
        }

        $line_item->update($request->all());

        return response()->json($line_item);
    }

    public function destroy(Requisition $requisition, RequisitionLineItem $line_item)
    {
        if ($requisition->status !== 'draft' && $requisition->status !== 'returned') {
            return response()->json(['message' => 'Line items can only be modified in draft or returned status.'], 422);
        }

        $line_item->delete();
        return response()->json(null, 204);
    }
}
