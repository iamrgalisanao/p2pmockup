# SOP-02: Vendor Quoting
> **Layer 1 — Architecture SOP**
> Last Updated: 2026-02-21 | Status: APPROVED

---

## Purpose
Define the rules for collecting, validating, and evaluating vendor quotes during the procurement process.

---

## Quote Collection Rules

### Minimum Quotes
- **Default:** ≥ 3 vendor quotes required before `quote_evaluation` state can begin.
- **Exception path:** If < 3 vendors are available (sole-source situation):
  1. Procurement officer submits exception justification (free text, required).
  2. Supervisor (department head or admin) must approve the exception via a dedicated approval action.
  3. Exception approval is logged to `audit_log` with `action = 'quote_exception_approved'`.
  4. Only after exception is approved can the system proceed to `quote_evaluation` with < 3 quotes.

### Who Enters Quotes
- Vendors do **not** log in. (Rule R-01)
- Procurement officers or procurement staff enter quotes on behalf of vendors.
- `submitted_by` on the `quote` record tracks which internal user entered it.

---

## Quote Data Rules

### Completeness (`is_complete`)
A quote is **complete** if the vendor has provided a unit price for **every** line item on the requisition's BOQ (Bill of Quantities).
- System checks: `count(quote_line_items) == count(requisition_line_items)` AND no `unit_price IS NULL`.
- `is_complete` is **system-calculated** — not a user toggle.

### Compliance (`is_compliant`)
A quote is **compliant** if it meets the technical specifications/scope defined in the requisition.
- `is_compliant` is a **user-set boolean** (procurement officer judgement), with mandatory `compliance_notes` when set to `false`.
- A non-compliant quote is excluded from the "lowest responsive bid" calculation.

### Totals (SYSTEM-CALCULATED)
All of the following are **never** user-editable:
- `quote_line_item.line_total = unit_price × requisition_line_item.quantity`
- `quote.grand_total = SUM(quote_line_item.line_total)`

---

## Cost Comparison (Evaluation)

### Responsive Bid Definition
A quote is **responsive** if AND ONLY IF:
- `is_complete = true` AND
- `is_compliant = true`

### Award Recommendation
1. System sorts all responsive quotes by `grand_total` ascending.
2. The quote with the **lowest** `grand_total` is highlighted as the recommended award.
3. Procurement officer reviews the comparison.

### Override
- If the recommended vendor is NOT the lowest responsive bid, this is an **override**.
- Override requires:
  - `award_basis = 'authorized_override'` on the NTA record.
  - `override_justification` (non-empty string, required).
  - `override_authorized_by` (UUID of the authorizing role, required).
  - Full entry in `audit_log` with `action = 'award_override'`.
- **Non-responsive quotes cannot win** — even with override.

---

## Quote States

| State | Description |
|-------|-------------|
| Active | Default — editable while requisition is in `for_quoting` |
| Locked | Once requisition moves to `quote_evaluation`, quotes are read-only |
| Awarded | The quote that was selected via NTA |
| Not Awarded | All other quotes after an award decision |

---

## Edge Cases

| Scenario | Handling |
|---------|---------|
| Same vendor submits twice | Reject second submission — one quote per vendor per requisition |
| All quotes are non-compliant | Block progression; require procurement officer to review specs or re-canvas |
| Tie on lowest responsive bid | System flags tie; procurement officer manually selects and documents reason |
| Quote entered with wrong quantity | Quantities come from the requisition line items — cannot be changed on the quote side |
| Quote attachments | Stored in object storage; linked via `attachment` record with `entity_type = 'quote'` |
