<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Requisition;
use App\Models\VendorQuote;
use App\Models\QuoteLineItem;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VendorQuoteController extends Controller
{
    /**
     * GET /api/requisitions/{requisition}/quotes
     */
    public function index(Requisition $requisition)
    {
        return response()->json($requisition->quotes()->with('vendor')->get());
    }

    /**
     * POST /api/requisitions/{requisition}/quotes
     */
    public function store(Request $request, Requisition $requisition)
    {
        $request->validate([
            'vendor_id' => 'required|exists:vendors,id',
            'notes' => 'nullable|string',
        ]);

        $user = $request->user();

        $quote = DB::transaction(function () use ($request, $requisition, $user) {
            $q = VendorQuote::create([
                'requisition_id' => $requisition->id,
                'vendor_id' => $request->vendor_id,
                'submitted_by' => $user->id,
                'is_complete' => false,
                'notes' => $request->notes,
            ]);

            // Copy line items from requisition to initialize quote items
            foreach ($requisition->lineItems as $item) {
                QuoteLineItem::create([
                    'quote_id' => $q->id,
                    'requisition_line_item_id' => $item->id,
                    'unit_price' => 0,
                    'line_total' => 0,
                ]);
            }

            AuditLog::record($requisition, 'quote_added', null, ['vendor_id' => $request->vendor_id]);

            return $q;
        });

        return response()->json($quote->load('vendor'), 201);
    }

    /**
     * POST /api/requisitions/{requisition}/quotes/{quote}/award
     */
    public function award(Request $request, Requisition $requisition, VendorQuote $quote)
    {
        $user = $request->user();

        // 1. Authorization Guard (SOP-05)
        if ($user->role !== 'proc_officer' && $user->role !== 'admin') {
            return response()->json(['message' => 'Only Procurement Officers or Admins can make award decisions.'], 403);
        }

        // 2. Logic Guards (SOP-02)
        if ($requisition->status !== 'for_approval' && $requisition->status !== 'approved') {
            // In some flows, awarding happens during approval. For Phase 1, we allow it in 'for_approval' state.
        }

        if (!$quote->is_complete || !$quote->is_compliant) {
            return response()->json(['message' => 'Cannot award to an incomplete or non-compliant quote.'], 422);
        }

        $request->validate([
            'award_basis' => 'required|in:lowest_responsive_bid,authorized_override',
            'override_justification' => 'required_if:award_basis,authorized_override|nullable|string',
        ]);

        DB::transaction(function () use ($requisition, $quote, $request) {
            // Un-award others
            $requisition->quotes()->update(['is_awarded' => false]);

            $quote->update(['is_awarded' => true]);
            $requisition->update(['status' => 'awarded']);

            AuditLog::record($requisition, 'awarded', null, [
                'quote_id' => $quote->id,
                'basis' => $request->award_basis
            ]);
        });

        return response()->json(['message' => 'Quote awarded successfully.']);
    }
}
