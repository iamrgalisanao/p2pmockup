# 📜 gemini.md — Project Constitution
> **This file is LAW.** Do not contradict it. Update ONLY when: a schema changes, a rule is added, or architecture is modified. Every change is logged in the Maintenance Log.

---

## 🆔 Project Identity
- **Project Name:** P2P Procurement System (P2Pmockup)
- **Workspace:** `e:\2026\P2Pmockup`
- **Initialized:** 2026-02-21
- **Protocol:** B.L.A.S.T. (Blueprint → Link → Architect → Stylize → Trigger)
- **Architecture:** A.N.T. 3-Layer (Architecture / Navigation / Tools)
- **Phase:** 2/3 — Link + Architect (Schema Locked ✅, Stack Locked ✅)

---

## 🛠️ Technology Stack (LOCKED)

| Layer | Technology | Version Target |
|-------|-----------|----------------|
| **Frontend** | ReactJS (Vite) | React 18+ |
| **Backend** | PHP Laravel | Laravel 11+ |
| **Database** | MySQL | 8.0+ |
| **ORM** | Eloquent (Laravel built-in) | — |
| **Auth** | Laravel Sanctum (API tokens) | — |
| **PDF Generation** | barryvdh/laravel-dompdf | Latest |
| **Excel Export** | maatwebsite/excel | 3.x |
| **Email** | Laravel Mail + SMTP | — |
| **Object Storage** | league/flysystem-aws-s3-v3 (S3-compatible) | — |
| **Queue / Jobs** | Laravel Queues (database driver Phase 1) | — |
| **HTTP Client (FE)** | Axios | Latest |
| **State Management** | TanStack Query (server state) + Zustand (UI state) | — |
| **Routing (FE)** | React Router v6 | v6+ |

---

## 🎯 North Star
> A single, webapp and mobile-friendly procurement system that turns a **requisition** into an **approved PO/JO + Notice to Award** — with full audit trail, required documents, and correct routing — **end-to-end**.

---

## 🔌 Integrations

### Phase 1 (Must-Have)
| Service | Purpose | Key Status |
|---------|---------|------------|
| SMTP / Microsoft 365 / Google Workspace | Approval notifications & task routing email | 🔴 Keys needed at Link phase |
| S3-compatible / Azure Blob / GCP Storage | Attachment storage + generated PDF hosting | 🔴 Keys needed at Link phase |
| Microsoft Entra ID / Google / Okta (optional) | SSO / MFA identity provider | 🟡 Optional in Phase 1 |

### Phase 2 (Nice-to-Have)
| Service | Purpose |
|---------|---------|
| SAP / Oracle / NetSuite / QuickBooks | Budget lines + PO syncing |
| WMS / Inventory system | Live stock checks |
| Slack / MS Teams | Approval ping notifications |

---

## 🗂️ Data Schema (LOCKED ✅)

> **Rule:** All totals are SYSTEM-CALCULATED. Users cannot override computed totals. Ever.
> **DB Engine:** MySQL 8.0+ · All money fields: `DECIMAL(15,4)` · UUIDs: `CHAR(36)` · Charset: `utf8mb4`

---

### Core Entities

#### 1. User
```json
{
  "id": "uuid",
  "email": "string",
  "full_name": "string",
  "role": "requester | department_head | procurement_officer | finance_reviewer | admin",
  "department_id": "uuid",
  "project_ids": ["uuid"],
  "is_active": "boolean",
  "created_at": "ISO datetime"
}
```

#### 2. Department / Project (Scope)
```json
{
  "id": "uuid",
  "name": "string",
  "type": "department | project",
  "parent_id": "uuid | null",
  "budget_limit": "decimal | null",
  "is_active": "boolean"
}
```

#### 3. Vendor
```json
{
  "id": "uuid",
  "name": "string",
  "contact_person": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "tax_id": "string",
  "accreditation_status": "active | suspended | blacklisted",
  "created_at": "ISO datetime"
}
```

---

### Input Payload — Requisition (PR) Creation
```json
{
  "requisition": {
    "id": "uuid",
    "ref_number": "PR-YYYY-#####",
    "title": "string",
    "department_id": "uuid",
    "project_id": "uuid | null",
    "requested_by": "uuid (user.id)",
    "date_needed": "ISO date",
    "priority": "normal | urgent",
    "description": "string",
    "line_items": [
      {
        "id": "uuid",
        "description": "string",
        "specification": "string | null",
        "unit": "string",
        "quantity": "decimal",
        "estimated_unit_cost": "decimal",
        "line_total": "decimal [SYSTEM-CALCULATED: quantity × unit_cost]"
      }
    ],
    "estimated_total": "decimal [SYSTEM-CALCULATED: sum of line_item.line_total]",
    "required_documents": ["enum: see Document Types below"],
    "checklist_satisfied": "boolean [SYSTEM-CALCULATED: all required docs attached]",
    "status": "draft | submitted | under_review | for_quoting | quote_evaluation | for_approval | approved | rejected | on_hold | awarded | po_issued | closed | cancelled",
    "hold_reason": "string | null",
    "sla_deadline": "ISO datetime | null",
    "sla_paused": "boolean",
    "created_at": "ISO datetime",
    "updated_at": "ISO datetime",
    "version": "integer [auto-increment on every mutation]"
  }
}
```

#### Document Types (Configurable Checklist)
```
purchase_request_form | canvass_sheet | abstract_of_quotations |
technical_specs | approved_budget | purchase_order | job_order |
notice_to_award | performance_bond | inspection_report | other
```

---

### Input Payload — Vendor Quote
```json
{
  "quote": {
    "id": "uuid",
    "requisition_id": "uuid",
    "vendor_id": "uuid",
    "submitted_at": "ISO datetime",
    "submitted_by": "uuid (user who entered quote)",
    "line_items": [
      {
        "requisition_line_item_id": "uuid",
        "unit_price": "decimal",
        "line_total": "decimal [SYSTEM-CALCULATED: unit_price × quantity]"
      }
    ],
    "grand_total": "decimal [SYSTEM-CALCULATED: sum of line_item.line_total]",
    "is_complete": "boolean (all BOQ line items priced)",
    "is_compliant": "boolean (meets spec/scope requirements)",
    "compliance_notes": "string | null",
    "attachments": ["attachment_id"],
    "notes": "string | null"
  }
}
```

---

### Approval Step
```json
{
  "approval_step": {
    "id": "uuid",
    "requisition_id": "uuid",
    "step_number": "integer",
    "step_label": "string (e.g. 'Department Head Approval')",
    "role_required": "department_head | procurement_officer | finance_reviewer | admin",
    "approver_id": "uuid | null (assigned or self-selected by role)",
    "action": "pending | approved | rejected | returned | on_hold",
    "comment": "string | null [REQUIRED for rejected | returned | on_hold]",
    "actioned_at": "ISO datetime | null",
    "sla_deadline": "ISO datetime",
    "sla_paused_at": "ISO datetime | null",
    "sla_resumed_at": "ISO datetime | null"
  }
}
```

---

### Attachment Record
```json
{
  "attachment": {
    "id": "uuid",
    "entity_type": "requisition | quote | po | jo | nta",
    "entity_id": "uuid",
    "doc_type": "enum (Document Types)",
    "original_filename": "string",
    "storage_key": "string (object storage key/path)",
    "mime_type": "string",
    "size_bytes": "integer",
    "uploaded_by": "uuid",
    "uploaded_at": "ISO datetime"
  }
}
```

---

### Audit Log Entry (Immutable)
```json
{
  "audit_log": {
    "id": "uuid",
    "entity_type": "requisition | quote | po | jo | nta | approval_step | vendor | user",
    "entity_id": "uuid",
    "action": "string (e.g. 'status_changed', 'approved', 'document_attached')",
    "actor_id": "uuid",
    "actor_role": "string",
    "before_state": "json | null",
    "after_state": "json | null",
    "ip_address": "string",
    "timestamp": "ISO datetime [immutable — never updated, never deleted]"
  }
}
```

---

### Output Payload — Purchase Order / Job Order
```json
{
  "po_jo": {
    "id": "uuid",
    "ref_number": "PO-YYYY-##### | JO-YYYY-#####",
    "type": "purchase_order | job_order",
    "requisition_id": "uuid",
    "vendor_id": "uuid",
    "awarded_quote_id": "uuid",
    "issued_by": "uuid",
    "issued_at": "ISO datetime",
    "line_items": [
      {
        "description": "string",
        "unit": "string",
        "quantity": "decimal",
        "unit_price": "decimal",
        "line_total": "decimal [SYSTEM-CALCULATED]"
      }
    ],
    "subtotal": "decimal [SYSTEM-CALCULATED]",
    "tax": "decimal [SYSTEM-CALCULATED]",
    "grand_total": "decimal [SYSTEM-CALCULATED]",
    "delivery_terms": "string",
    "payment_terms": "string",
    "status": "draft | issued | mark_sent | acknowledged | completed | cancelled",
    "sent_at": "ISO datetime | null [set on manual 'Mark as Sent' only]",
    "pdf_storage_key": "string",
    "created_at": "ISO datetime"
  }
}
```

### Output Payload — Notice to Award (NTA)
```json
{
  "notice_to_award": {
    "id": "uuid",
    "ref_number": "NTA-YYYY-#####",
    "requisition_id": "uuid",
    "vendor_id": "uuid",
    "awarded_quote_id": "uuid",
    "award_basis": "lowest_responsive_bid | authorized_override",
    "override_justification": "string | null [required if award_basis = authorized_override]",
    "override_authorized_by": "uuid | null",
    "issued_by": "uuid",
    "issued_at": "ISO datetime",
    "pdf_storage_key": "string",
    "status": "draft | issued | mark_sent",
    "sent_at": "ISO datetime | null"
  }
}
```

---

## 📐 Architectural Invariants (INVIOLABLE)

1. **No tool scripts in `tools/` until schema is approved.** ✅ *(Now lifted — schema locked)*
2. **`.tmp/` is ephemeral** — never reference `.tmp/` files as final outputs. Intermediate only.
3. **SOPs in `architecture/` are updated before code changes.**
4. **All secrets live in `.env`** — never hardcoded anywhere.
5. **A project is only "Complete" when the Payload reaches its final destination** (dashboard live + PDFs generated + audit log persisted).
6. **Audit log entries are immutable** — no UPDATE or DELETE ever on `audit_log` table.
7. **Concurrency safety required** — approval actions must use DB-level locking (optimistic or pessimistic) to prevent double-approve.
8. **Checklist gate is system-enforced** — a requisition cannot transition from `draft` to `submitted` unless `checklist_satisfied = true`.
9. **≥3 vendor quotes required** before cost comparison step. Exceptions require justification text + supervisor approval action in the audit trail.
10. **"Lowest responsive bid" is the default award basis.** Override requires: authorized role + mandatory justification field + audit log entry.

---

## 📏 Behavioral Rules (HARD RULES)

| # | Rule |
|---|------|
| R-01 | **No vendor portal.** Vendors do not have login access. Ever. |
| R-02 | **No auto-forwarding.** PO/JO/NTA are never automatically sent to vendors. Manual "Mark as Sent" only. |
| R-03 | **Role-based access is scoped.** Users only see data within their department/project scope. |
| R-04 | **One action per step.** An approval step that has been actioned cannot be re-actioned (concurrency-safe). |
| R-05 | **Comments mandatory on rejection/return/hold.** The system blocks the action if the comment field is empty. |
| R-06 | **Holds pause SLA timers.** `sla_deadline` recalculation begins on resume, not on hold. |
| R-07 | **All totals are system-calculated.** No user-editable total fields. |
| R-08 | **Required document checklist is configurable per requisition type.** Enforced at submission gate. |
| R-09 | **≥3 vendor quotes required.** System blocks cost comparison step if quote count < 3 (unless exception is approved). |
| R-10 | **Award defaults to lowest responsive bid.** Override = authorized role + justification + audited. |

---

## 🗺️ File & Folder Structure
```
e:\2026\P2Pmockup\
├── gemini.md              # Project Constitution (this file) — LAW
├── .env                   # API Keys/Secrets (never committed to git)
├── .env.example           # Safe template for .env
├── task_plan.md           # Phases, goals, checklists
├── findings.md            # Research, discoveries, constraints
├── progress.md            # Done/errors/test results
│
├── architecture/          # Layer 1: SOPs (Markdown spec docs)
│   ├── 01_requisition_workflow.md
│   ├── 02_vendor_quoting.md
│   ├── 03_approval_routing.md
│   ├── 04_document_generation.md
│   └── 05_roles_and_permissions.md
│
├── tools/                 # Layer 3: Link verification scripts
│   ├── verify_db.py       # MySQL connection check
│   ├── verify_email.py    # SMTP handshake
│   └── verify_storage.py  # S3 upload/presign/delete
│
├── backend/               # Laravel 11 PHP application
│   ├── app/
│   ├── database/migrations/
│   ├── routes/api.php
│   └── ...
│
├── frontend/              # ReactJS (Vite) application
│   ├── src/
│   ├── public/
│   └── ...
│
└── .tmp/                  # Ephemeral workbench
```

---

## 🔧 Maintenance Log
| Date | Author | Change |
|------|--------|--------|
| 2026-02-21 | System Pilot | Initial constitution created (pre-discovery) |
| 2026-02-21 | System Pilot | **SCHEMA LOCKED** — Full P2P schema, behavioral rules, and architectural invariants committed post-Discovery Q&A |
| 2026-02-21 | System Pilot | **STACK LOCKED** — ReactJS (Vite) + PHP Laravel 11 + MySQL 8.0. Replaces assumed FastAPI/PostgreSQL/Next.js. All affected SOPs and tools updated. |
