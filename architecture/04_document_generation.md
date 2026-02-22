# SOP-04: Document Generation
> **Layer 1 — Architecture SOP**
> Last Updated: 2026-02-21 | Status: APPROVED
> **Stack: PHP Laravel + barryvdh/laravel-dompdf + maatwebsite/excel**

---

## Purpose
Define the rules for generating all official documents: Requisition PDF, Cost Comparison Pack, Notice to Award (NTA), Purchase Order (PO), Job Order (JO), and Excel export.

---

## Technology Stack
| Component | Tool | Rationale |
|-----------|------|-----------|
| HTML → PDF | `barryvdh/laravel-dompdf` | Native Laravel Composer package; renders Blade templates to PDF |
| Excel generation | `maatwebsite/excel` (Laravel Excel) | Template export + dynamic workbook generation |
| PDF Templates | Laravel Blade views in `resources/views/pdf/` | Clean separation of template from logic |
| Storage | `league/flysystem-aws-s3-v3` via Laravel Filesystem | S3-compatible; configured via `config/filesystems.php` |
| Serving | Presigned URL via Laravel Storage `temporaryUrl()` | No public bucket; time-limited secure access |

---

## Installation (Composer)
```bash
composer require barryvdh/laravel-dompdf
composer require maatwebsite/excel
composer require league/flysystem-aws-s3-v3
```

---

## Documents Reference

### 1. Requisition Print View (PR PDF)
- **Trigger:** Available to authorized roles once status ≥ `submitted`
- **Laravel Route:** `GET /api/requisitions/{id}/pdf`
- **Blade Template:** `resources/views/pdf/requisition.blade.php`
- **Content:**
  - Company letterhead (logo, address)
  - PR reference number, date, department, project
  - Requester name
  - Line items table (description, unit, quantity, estimated cost, line total)
  - Estimated grand total (**system-calculated from DB — never from user input**)
  - Attached document checklist (checked/unchecked)
  - Status + current approval step
  - Signature block

### 2. Cost Comparison Pack (PDF)
- **Trigger:** Generated when status = `quote_evaluation`
- **Laravel Route:** `GET /api/requisitions/{id}/cost-comparison/pdf`
- **Blade Template:** `resources/views/pdf/cost_comparison.blade.php`
- **Content:**
  - PR reference + title
  - Side-by-side vendor comparison table (rows = line items, columns = vendors)
  - System-highlighted lowest responsive bid column
  - `is_complete` and `is_compliant` flags per vendor
  - Recommended award with basis statement
  - Grand total row per vendor (**system-calculated**)

### 3. Notice to Award (NTA PDF)
- **Trigger:** Generated on `awarded` status transition
- **Laravel Route:** `GET /api/requisitions/{id}/nta/pdf`
- **Blade Template:** `resources/views/pdf/nta.blade.php`
- **Content:**
  - NTA reference number (`NTA-YYYY-#####`)
  - Date of award
  - Awarded vendor name + contact
  - Description of works/goods
  - Awarded amount (**system-calculated grand total**)
  - Award basis: "Lowest Responsive Bid" OR "Authorized Override" + justification
  - Authorized signatories block
  - "Mark as Sent" stamp appended after manual action (regenerated)

### 4. Purchase Order (PO PDF)
- **Trigger:** Generated on `po_issued` status, type = `purchase_order`
- **Laravel Route:** `GET /api/purchase-orders/{id}/pdf`
- **Blade Template:** `resources/views/pdf/purchase_order.blade.php`
- **Content:**
  - PO reference number (`PO-YYYY-#####`)
  - Issue date + vendor details (name, address, tax ID)
  - Delivery address + terms, payment terms
  - Line items table
  - Subtotal, tax, grand total (**all system-calculated**)
  - Authorized signatory block
  - "Mark as Sent" timestamp stamp

### 5. Job Order (JO PDF)
- Same as PO with `type = job_order`; additional fields: scope of work, completion date, site address
- **Blade Template:** `resources/views/pdf/job_order.blade.php`

### 6. Excel Export
- **Trigger:** Dashboard export button (authorized roles)
- **Laravel Route:** `GET /api/reports/export?type=requisitions&from=&to=&dept=`
- **Implementation:** `App\Exports\RequisitionsExport` using `maatwebsite/excel`
- **Format:**
  - Sheet 1: Requisitions summary (one row per PR)
  - Sheet 2: Line items detail
  - Sheet 3: Approval history
  - Headers frozen, filters applied via `WithHeadingRow`

---

## PDF Generation Pattern (Laravel DomPDF)

```php
// Example: Generating a PO PDF and storing to S3
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

$pdf = Pdf::loadView('pdf.purchase_order', compact('po', 'lineItems', 'vendor'))
          ->setPaper('a4', 'portrait');

$key = "docs/requisitions/{$po->ref_number}/po.pdf";
Storage::disk('s3')->put($key, $pdf->output());

// Update the PO record with the storage key
$po->update(['pdf_storage_key' => $key]);

// Log the generation
AuditLog::record($po, 'document_generated', ['storage_key' => $key]);
```

---

## Storage Key Convention
```
docs/requisitions/{req_ref_number}/pr.pdf
docs/requisitions/{req_ref_number}/cost_comparison.pdf
docs/requisitions/{req_ref_number}/nta.pdf
docs/requisitions/{req_ref_number}/po.pdf
docs/requisitions/{req_ref_number}/jo.pdf
```

## Presigned URL (Laravel)
```php
$url = Storage::disk('s3')->temporaryUrl($key, now()->addSeconds(3600));
```

---

## Mark as Sent Flow (Rule R-02 — NEVER auto-send)
1. User clicks "Mark as Sent" button.
2. Laravel controller:
   a. Sets `sent_at = now()` on the PO/JO/NTA record.
   b. Regenerates the PDF with a "Sent: {date} by {user.name}" footer stamp.
   c. Stores new PDF (overwrites or versions the file in S3).
   d. Writes `AuditLog::record($entity, 'marked_sent', [...])`.
3. **No email is automatically sent to vendor.** (Hard rule R-02)

---

## Audit on Every Generation
Every call to generate a PDF writes to `audit_logs`:
```
action:       'document_generated'
entity_type:  'purchase_order' | 'notice_to_award' | 'requisition' | ...
entity_id:    {uuid}
after_state:  { storage_key: '...', generated_at: '...' }
actor_id:     {requesting user uuid}
```

---

## Edge Cases

| Scenario | Handling |
|---------|---------|
| DomPDF font rendering | Place fonts in `storage/fonts/` and configure DomPDF `font_dir` in `config/dompdf.php` |
| Large line item tables | Force page break via CSS `page-break-inside: avoid` in Blade PDF template |
| Regeneration after `mark_sent` | Overwrite the S3 key with the stamped version; original timestamp in audit log |
| Currency formatting | Use PHP `number_format()` or Laravel `money` helper; never float arithmetic |
| Excel template missing | maatwebsite/excel builds dynamically from `WithHeadings` — no static template required |
| S3 connection failure during generation | PDF is still returned to user; async retry job queued to re-upload |
