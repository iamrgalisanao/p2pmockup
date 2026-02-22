# SOP-01: Requisition Workflow
> **Layer 1 — Architecture SOP**
> Last Updated: 2026-02-21 | Status: APPROVED

---

## Purpose
Define every state a Requisition (PR) can be in, the valid transitions between states, and the **guards** (conditions) that must be true for a transition to occur.

---

## State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                   REQUISITION STATUS FLOW                    │
│                                                             │
│  [draft] ──(submit)──► [submitted]                          │
│                              │                              │
│                        (auto-route)                         │
│                              ▼                              │
│                      [under_review]                         │
│                         │       │                           │
│                    (flag)    (advance)                      │
│                       ▼         ▼                           │
│                 [on_hold]  [for_quoting]                    │
│                    │             │                          │
│                (resume)    (quotes collected)               │
│                    │             ▼                          │
│                    └──►  [quote_evaluation]                 │
│                                  │                          │
│                           (evaluation done)                 │
│                                  ▼                          │
│                           [for_approval]                    │
│                          │    │     │                       │
│                      (hold) (reject)(approve)               │
│                        │      │        │                    │
│                   [on_hold] [rejected][approved]            │
│                                            │                │
│                                       (award)               │
│                                            ▼                │
│                                        [awarded]            │
│                                            │                │
│                                      (issue PO/JO)          │
│                                            ▼                │
│                                       [po_issued]           │
│                                            │                │
│                                       (complete)            │
│                                            ▼                │
│                                        [closed]             │
│                                                             │
│  Any state (except closed) ──(cancel)──► [cancelled]        │
└─────────────────────────────────────────────────────────────┘
```

---

## States Reference

| State | Description |
|-------|-------------|
| `draft` | Created but not submitted. Editable. |
| `submitted` | Locked for editing. Awaiting initial review. |
| `under_review` | Procurement officer reviewing completeness. |
| `for_quoting` | Cleared for vendor quote collection (≥3 required). |
| `quote_evaluation` | Quotes are in; procurement is comparing/evaluating. |
| `for_approval` | Evaluation complete; in the approver's inbox. |
| `on_hold` | Paused — SLA timer suspended. Comment required. |
| `approved` | All approvers signed off. |
| `rejected` | Rejected by an approver. Comment required. Returnable. |
| `awarded` | Vendor selected; NTA generated. |
| `po_issued` | PO or JO has been issued (PDF generated). |
| `closed` | Fully complete. No further actions. |
| `cancelled` | Voided. Immutable. |

---

## Transition Guards

| From → To | Guard Conditions |
|-----------|-----------------|
| `draft` → `submitted` | `checklist_satisfied = true` (all required docs attached) |
| `submitted` → `under_review` | Automatic on receipt by procurement role |
| `under_review` → `for_quoting` | Procurement officer approves completeness |
| `for_quoting` → `quote_evaluation` | Quote count ≥ 3 (or exception approved) |
| `quote_evaluation` → `for_approval` | Evaluation complete; recommended vendor set |
| `for_approval` → `approved` | All approval steps actioned = `approved` |
| `for_approval` → `rejected` | Any approver actions `rejected`; comment required |
| `approved` → `awarded` | Award decision made; override justification if not lowest responsive bid |
| `awarded` → `po_issued` | PO/JO PDF generated, status set |
| `po_issued` → `closed` | All deliverables confirmed |
| `* → on_hold` | `comment` field non-empty; `sla_paused_at` set |
| `on_hold` → (prior state) | Resumed by authorized user; `sla_deadline` recalculated |
| `* → cancelled` | Authorized role; not from `closed` |

---

## SLA Rules
- SLA is tracked as an absolute `sla_deadline` timestamp on the requisition.
- On **hold**: record `sla_paused_at = NOW()`.
- On **resume**: `sla_deadline = sla_deadline + (NOW() - sla_paused_at)`.
- SLA breach triggers email notification to department head and procurement supervisor.
- SLA is not enforced for `draft` state.

---

## Versioning
- Every mutation to a requisition increments `version` (integer).
- Optimistic locking: before any write, read `version` → include in WHERE clause → if 0 rows updated, raise `ConflictError` and prompt the user to refresh.

---

## Edge Cases
| Scenario | Handling |
|---------|---------|
| Requester edits after submission | Blocked — only `draft` is editable |
| Two approvers act simultaneously | Optimistic lock: second action fails with 409 Conflict |
| Quote count < 3 at evaluation | Block transition; show error with exception-request option |
| Cancelled requisition viewed | Read-only; no actions available |
| Reject when already rejected | Idempotent guard: block duplicate action |
