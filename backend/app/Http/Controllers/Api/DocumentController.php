<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Requisition;
use App\Models\PurchaseOrder;
use App\Models\PoLineItem;
use App\Models\NoticeToAward;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    /**
     * POST /api/requisitions/{requisition}/documents/generate
     * Triggers generation of PDF documents based on status.
     */
    public function generate(Request $request, Requisition $requisition)
    {
        $type = $request->validate(['type' => 'required|in:requisition,nta,po,jo'])['type'];

        // 1. Guard for states
        if ($type === 'po' || $type === 'jo') {
            if ($requisition->status !== 'approved' && $requisition->status !== 'awarded') {
                return response()->json(['message' => 'PO can only be generated after approval.'], 422);
            }
        }

        // 2. Generation Logic
        try {
            switch ($type) {
                case 'requisition':
                    $pdf = Pdf::loadView('pdfs.requisition', ['requisition' => $requisition->load(['department', 'project', 'lineItems', 'requester', 'approvalSteps.approver'])]);
                    return $pdf->download("PR_{$requisition->ref_number}.pdf");

                case 'po':
                case 'jo':
                    return $this->generatePO($requisition, $type);

                case 'nta':
                    return $this->generateNTA($requisition);
            }
        } catch (\Exception $e) {
            return response()->json(['message' => 'PDF generation failed: ' . $e->getMessage()], 500);
        }
    }

    private function generatePO(Requisition $requisition, string $type)
    {
        $awardedQuote = $requisition->quotes()->where('is_awarded', true)->first();
        if (!$awardedQuote) {
            return response()->json(['message' => 'No awarded quote found for this requisition.'], 422);
        }

        return DB::transaction(function () use ($requisition, $awardedQuote, $type) {
            // Create PO if doesn't exist
            $po = PurchaseOrder::firstOrCreate(
                ['requisition_id' => $requisition->id],
                [
                    'ref_number' => ($type === 'po' ? 'PO' : 'JO') . '-' . date('Y') . '-' . strtoupper(\Illuminate\Support\Str::random(5)),
                    'type' => $type === 'po' ? 'purchase_order' : 'job_order',
                    'vendor_id' => $awardedQuote->vendor_id,
                    'awarded_quote_id' => $awardedQuote->id,
                    'issued_by' => auth()->id(),
                    'issued_at' => now(),
                    'status' => 'draft',
                ]
            );

            // Copy Quote Lines if new PO
            if ($po->lineItems()->count() === 0) {
                foreach ($awardedQuote->lineItems as $qLine) {
                    PoLineItem::create([
                        'purchase_order_id' => $po->id,
                        'description' => $qLine->requisitionLineItem->description,
                        'unit' => $qLine->requisitionLineItem->unit,
                        'quantity' => $qLine->requisitionLineItem->quantity,
                        'unit_price' => $qLine->unit_price,
                        'line_total' => $qLine->line_total,
                    ]);
                }
                $po->recalculateTotals();
            }

            $pdf = Pdf::loadView('pdfs.po', ['po' => $po->load(['vendor', 'requisition.department', 'lineItems', 'issuedBy'])]);

            // Save to S3
            $path = "documents/pos/PO_{$po->ref_number}.pdf";
            Storage::disk('s3')->put($path, $pdf->output());
            $po->update(['pdf_storage_key' => $path]);

            $requisition->update(['status' => 'po_issued']);
            AuditLog::record($requisition, "po_generated", null, ['po_id' => $po->id]);

            return $pdf->download("PO_{$po->ref_number}.pdf");
        });
    }

    private function generateNTA(Requisition $requisition)
    {
        $awardedQuote = $requisition->quotes()->where('is_awarded', true)->first();
        if (!$awardedQuote) {
            return response()->json(['message' => 'No awarded quote found for this requisition.'], 422);
        }

        return DB::transaction(function () use ($requisition, $awardedQuote) {
            $nta = NoticeToAward::firstOrCreate(
                ['requisition_id' => $requisition->id],
                [
                    'ref_number' => 'NTA-' . date('Y') . '-' . strtoupper(\Illuminate\Support\Str::random(5)),
                    'vendor_id' => $awardedQuote->vendor_id,
                    'awarded_quote_id' => $awardedQuote->id,
                    'award_basis' => 'lowest_responsive_bid',
                    'issued_by' => auth()->id(),
                    'issued_at' => now(),
                    'status' => 'issued',
                ]
            );

            $pdf = Pdf::loadView('pdfs.nta', ['nta' => $nta->load(['vendor', 'requisition', 'awardedQuote', 'issuedBy'])]);

            $path = "documents/ntas/NTA_{$nta->ref_number}.pdf";
            Storage::disk('s3')->put($path, $pdf->output());
            $nta->update(['pdf_storage_key' => $path]);

            AuditLog::record($requisition, "nta_generated", null, ['nta_id' => $nta->id]);

            return $pdf->download("NTA_{$nta->ref_number}.pdf");
        });
    }

    public function view(Request $request, Requisition $requisition)
    {
        $type = $request->validate(['type' => 'required|in:requisition,nta,po,jo'])['type'];
        $path = null;

        switch ($type) {
            case 'po':
            case 'jo':
                $path = $requisition->purchaseOrder?->pdf_storage_key;
                break;
            case 'nta':
                $path = $requisition->noticeToAward?->pdf_storage_key;
                break;
        }

        if (!$path) {
            return response()->json(['message' => 'Document not found.'], 404);
        }

        $url = Storage::disk('s3')->temporaryUrl($path, now()->addMinutes(15));
        return response()->json(['url' => $url]);
    }

    public function markSent(Request $request, Requisition $requisition)
    {
        $type = $request->input('type', 'po'); // default to po

        if ($type === 'nta') {
            $doc = $requisition->noticeToAward;
            if (!$doc)
                return response()->json(['message' => 'NTA not found.'], 404);

            $doc->update(['status' => 'mark_sent', 'sent_at' => now()]);

            // Regenerate NTA with "SENT" stamp
            $pdf = Pdf::loadView('pdfs.nta', ['nta' => $doc->load(['vendor', 'requisition', 'awardedQuote', 'issuedBy'])]);
            Storage::disk('s3')->put($doc->pdf_storage_key, $pdf->output());

            AuditLog::record($requisition, "nta_marked_as_sent");
        } else {
            if ($requisition->status !== 'po_issued') {
                return response()->json(['message' => 'Document must be issued before marking as sent.'], 422);
            }

            $doc = $requisition->purchaseOrder;
            $doc->update(['status' => 'mark_sent', 'sent_at' => now()]);

            // Regenerate PO with "SENT" stamp (assuming stamp logic in Blade)
            $pdf = Pdf::loadView('pdfs.po', ['po' => $doc->load(['vendor', 'requisition.department', 'lineItems', 'issuedBy'])]);
            Storage::disk('s3')->put($doc->pdf_storage_key, $pdf->output());

            AuditLog::record($requisition, "po_marked_as_sent");
        }

        return response()->json(['message' => 'Document marked as sent.']);
    }
}
