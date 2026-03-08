<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Grn;
use App\Models\PurchaseOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GrnController extends Controller
{
    public function index(Request $request)
    {
        $query = Grn::with(['purchaseOrder.vendor', 'purchaseOrder.requisition.department']);

        if ($request->filled('date_from')) {
            $query->whereDate('received_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('received_date', '<=', $request->date_to);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('ref_number', 'like', "%$s%")
                    ->orWhere('received_by', 'like', "%$s%")
                    ->orWhereHas('purchaseOrder', function ($pq) use ($s) {
                        $pq->where('ref_number', 'like', "%$s%")
                            ->orWhereHas('vendor', fn($v) => $v->where('name', 'like', "%$s%"));
                    });
            });
        }

        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = $request->input('sort_dir', 'desc');
        $allowedSorts = ['created_at', 'received_date', 'ref_number'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->reorder($sortBy, $sortDir);
        }

        return $query->paginate($request->input('per_page', 15));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'purchase_order_id' => 'required|exists:purchase_orders,id',
            'received_date' => 'required|date',
            'received_by' => 'required|string',
            'remarks' => 'nullable|string',
            'line_items' => 'required|array|min:1',
            'line_items.*.po_line_item_id' => 'required|exists:po_line_items,id',
            'line_items.*.quantity_received' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($validated) {
            $po = PurchaseOrder::findOrFail($validated['purchase_order_id']);

            $grn = Grn::create([
                'ref_number' => 'GRN-' . date('Y') . '-' . strtoupper(Str::random(5)),
                'purchase_order_id' => $validated['purchase_order_id'],
                'received_date' => $validated['received_date'],
                'received_by' => $validated['received_by'],
                'remarks' => $validated['remarks'] ?? null,
                'status' => 'received',
            ]);

            $allReceived = true;
            foreach ($validated['line_items'] as $item) {
                // Find matching PO line item to check qty
                $poItem = $po->lineItems()->find($item['po_line_item_id']);

                // Track total received for this item across ALL GRNs
                $previouslyReceived = \App\Models\GrnLineItem::where('po_line_item_id', $item['po_line_item_id'])->sum('quantity_received');
                $newTotal = $previouslyReceived + $item['quantity_received'];

                if ($poItem && $newTotal < $poItem->quantity) {
                    $allReceived = false;
                }

                $grn->lineItems()->create([
                    'po_line_item_id' => $item['po_line_item_id'],
                    'quantity_received' => $item['quantity_received'],
                    'remarks' => $item['remarks'] ?? null,
                ]);
            }

            // If all items are fully accounted for, mark PO and Requisition as completed
            if ($allReceived) {
                $po->update(['status' => 'completed']);
                if ($po->requisition) {
                    $po->requisition->update(['status' => 'completed']);
                }
            }

            return response()->json($grn->load('lineItems'), 201);
        });
    }

    public function show(Grn $grn)
    {
        return $grn->load(['lineItems.poLineItem', 'purchaseOrder.vendor', 'purchaseOrder.lineItems']);
    }
}
