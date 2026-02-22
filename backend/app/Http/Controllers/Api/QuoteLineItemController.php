<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Requisition;
use App\Models\QuoteLineItem;
use App\Models\VendorQuote;
use Illuminate\Http\Request;

class QuoteLineItemController extends Controller
{
    /**
     * PUT /api/requisitions/{requisition}/quotes/{quote}/line-items
     * Bulk update unit prices for a quote.
     */
    public function bulkUpdate(Request $request, Requisition $requisition, VendorQuote $quote)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:quote_line_items,id',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        foreach ($request->items as $itemData) {
            $item = QuoteLineItem::findOrFail($itemData['id']);
            $item->update(['unit_price' => $itemData['unit_price']]);
        }

        // Parent quote recalculation is triggered by model boot events

        return response()->json(['message' => 'Quote pricing updated.', 'quote' => $quote->fresh()]);
    }
}
