# 🟢 developer_notes.md — Living Developer Handover

> **Purpose:** Internal documentation for developers to understand the "Why" and "How" of implemented features, architectural patterns, and future integration points.

---

## 🏗️ Architecture Overview

The system follows the **A.N.T. 3-Layer** architecture:
1.  **Architecture (Layer 1):** SOP-driven development. Logic is defined in `architecture/*.md` before being coded.
2.  **Navigation (Layer 2):** React SPA with centralized routing and role-based guards.
3.  **Tools (Layer 3):** Utility scripts for verifying infrastructure (DB, S3, SMTP).

---

## 🛠️ Key Implementation Patterns

### 1. Requisition Workflow (The State Machine)
- **Logic Location:** `backend/app/Services/RequisitionWorkflowService.php`
- **Pattern:** State machine with guards.
- **Workflow Sequence:**
    - `draft` → `submitted` (Gate: `checklist_satisfied`)
    - `submitted` → `for_sap_entry`
    - `for_sap_entry` → `sap_verified` (Requestor confirms SAP JO/PO details)
    - `sap_verified` → `under_review` (Internal approvals begin)
- **Hierarchical Approval Injection:** If a requester has a `supervisor_id` set, the `RequisitionWorkflowService` automatically injects a "Direct Supervisor Approval" step at the beginning of the chain (Step 1).
- **R-13 Reactivation:** When a request is reactivated, the `RequisitionWorkflowService@reactivate` method:
    1. Clones the existing record.
    2. Increments the series (e.g., `-R1`, `-R2`).
    3. Links the old record via `superseded_by_id`.
    4. Copies all line items and attachments.

### 2. RFP (Request for Payment) Workflow
- **Logic Location:** `backend/app/Services/PaymentRequestWorkflowService.php`
- **Prerequisite:** A JO/PO must be validated by Accounting before an RFP can be generated.
- **Status Flow:** `draft` → `accounting_validated` → `approvals` → `paid`.

### 3. Actionable Email Notifications (R-11)
- **Provider:** Laravel Mail.
- **Implementation:**
    - Emails use the `signed` middleware in Laravel.
    - Approval buttons in emails are **Signed URLs** that expire and are tied to a specific user/step.
    - **Security:** Clicking "Approve" from an email executes a `POST` request to a secure endpoint that validates the signature before updating the `ApprovalStep`.

### 4. Goods Received Note (GRN) / Receiving
- **Logic Location:** `backend/app/Http/Controllers/Api/GrnController.php`
- **Pattern:** Partial receiving is allowed and tracked.
- **Auto-Completion:** The system validates `quantity_received` against PO quantities. Once all line items are fully received, the `PurchaseOrder` and its linked `Requisition` are automatically marked as `completed`.
- **Workflow:** `PO` → `GRN Entry` (updates `line_items.received_quantity`).

### 5. Budget Monitoring & Cost Centers
- **Logic Location:** `backend/app/Services/BudgetService.php`
- **Pattern:** Audited Ledger.
- **Flow:** Every budget change creates a `BudgetLedger` entry.

### 6. Interactive Help System
- **Logic Location:** `frontend/src/components/HelpSystem.jsx`
- **Pattern:** Context-aware side drawer.
- **Config:** Guide content is managed in `frontend/src/config/helpData.js`.

---

## 🔌 Integration Guides

### SAP Integration (Simulation)
- **Service:** `backend/app/Services/SapIntegrationService.php`
- **Current State:** Simulated responses for demo purposes.
- **How to upgrade to live:**
    1. Update the `.env` with SAP RFC or OData credentials.
    2. Replace the `mock()` calls in `SapIntegrationService` with Guzzle/Http-client calls to the SAP gateway.

### Audit Log (Immutable)
- **Constraint:** The `audit_logs` table has NO `update` or `delete` routes.
- **Observer:** `backend/app/Observers/AuditObserver.php` automatically records `before` and `after` states on all tracked models.

---

## 📋 Developer FAQ

**Q: How do I add a new required document type?**
A: Update the `Document Types` enum in `gemini.md` and the `requisition_types` lookup table in the database.

**Q: How is department-scoping enforced?**
A: Via a Global Scope in Laravel: `App\Models\Scopes\DepartmentScope`. It automatically appends `WHERE department_id = user().department_id` to all queries unless explicitly disabled with `withoutGlobalScopes()`.

**Q: Where is the SLA logic handled?**
A: A scheduled artisan command `p2p:check-sla` runs hourly, checks `sla_deadline` against `now()`, and triggers notifications if breached.

---

## 🔧 Maintenance Log
| Date | Author | Feature / Change | Notes |
|------|--------|------------------|-------|
| 2026-03-08 | System Pilot | RFP Workflow & Actionable Emails | Implemented R-14 (accounting-validated RFP chain) and R-11 (signed-URL email actions). |
| 2026-03-08 | System Pilot | Hierarchy & GRN Integration | Added Supervisor approval and GRN partial receipt logic. |
| 2026-03-08 | System Pilot | Search & UI Optimization | Implemented debounced global search and filter drawer. |
