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

        if ($request->has('search')) {
            $s = $request->search;
            $query->where('ref_number', 'LIKE', "%$s%")
                ->orWhereHas('purchaseOrder', function ($q) use ($s) {
                    $q->where('ref_number', 'LIKE', "%$s%");
                });
        }

        return $query->latest()->paginate(15);
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
            $grn = Grn::create([
                'ref_number' => 'GRN-' . date('Y') . '-' . strtoupper(Str::random(5)),
                'purchase_order_id' => $validated['purchase_order_id'],
                'received_date' => $validated['received_date'],
                'received_by' => $validated['received_by'],
                'remarks' => $validated['remarks'] ?? null,
                'status' => 'received',
            ]);

            foreach ($validated['line_items'] as $item) {
                $grn->lineItems()->create([
                    'po_line_item_id' => $item['po_line_item_id'],
                    'quantity_received' => $item['quantity_received'],
                    'remarks' => $item['remarks'] ?? null,
                ]);
            }

            return response()->json($grn->load('lineItems'), 201);
        });
    }

    public function show(Grn $grn)
    {
        return $grn->load(['lineItems.poLineItem', 'purchaseOrder.vendor', 'purchaseOrder.lineItems']);
    }
}
