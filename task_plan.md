# 📋 task_plan.md — B.L.A.S.T. Project Task Plan
> **Project:** P2P Procurement System
> **Status:** 🟢 Phase 1 Complete — Blueprint APPROVED | Phase 2 (Link) Ready to Begin

---

## ✅ Protocol 0: Initialization — COMPLETE
- [x] Create `gemini.md` (Project Constitution)
- [x] Create `task_plan.md`
- [x] Create `findings.md`
- [x] Create `progress.md`
- [x] Answer 5 Discovery Questions
- [x] Define Data Schema in `gemini.md`
- [x] Behavioral Rules documented (R-01 through R-10)
- [x] Architectural Invariants locked (1 through 10)

---

## ✅ Phase 1: B — Blueprint — COMPLETE

### North Star
> A single, mobile-friendly procurement system that turns a requisition into an approved PO/JO + Notice to Award — with full audit trail, required documents, and correct routing — end-to-end.

### Approved Blueprint Summary
**System:** Full Procure-to-Pay (P2P) Web Application
**Stack (LOCKED):** ReactJS + Vite (frontend) + PHP Laravel 11 (backend) + MySQL 8.0 (DB) + S3-compatible storage

### Core Workflow (Happy Path)
```
[Create PR] → [Attach Required Docs] → [Submit]
   → [Dept Head Review] → [Procurement Review]
   → [Collect ≥3 Vendor Quotes] → [Cost Comparison]
   → [Finance Review] → [Award Decision (lowest responsive bid)]
   → [Generate NTA] → [Generate PO/JO]
   → [Manual: Mark as Sent]
```

### Key Modules
| # | Module | Description |
|---|--------|-------------|
| M1 | Requisition Management | Create, edit (draft), submit PRs with line items |
| M2 | Document Checklist | Configurable required-doc gate at submission |
| M3 | Vendor Quote Collection | ≥3 quotes, BOQ line-item pricing, completeness flag |
| M4 | Cost Comparison | Side-by-side quote comparison, auto lowest-bid detection |
| M5 | Approval Workflow | Configurable multi-step routing, SLA timers, hold/reject |
| M6 | Award & NTA | Award decision with override justification, NTA generation |
| M7 | PO/JO Generation | PDF generation, manual Mark-as-Sent |
| M8 | Audit Trail | Immutable log of every state change with actor + diff |
| M9 | Dashboard & Inbox | Approval inbox, request tracking, status board |
| M10 | Reporting & Export | Excel/CSV export, PDF print views |

### Phase 1 Checklist — Blueprint
- [x] Discovery Q&A completed
- [x] North Star confirmed
- [x] Integrations identified
- [x] Source of Truth: PostgreSQL relational DB
- [x] Delivery Payload: Web dashboard + PDF + Excel + Email
- [x] Behavioral Rules: R-01 to R-10 locked in gemini.md
- [x] Input JSON schema defined (Requisition, Quote, Approval, Attachment, Audit)
- [x] Output JSON schema defined (PO/JO, NTA)
- [x] Blueprint approved ✅

---

## 🔄 Phase 2: L — Link (Connectivity) — NEXT

**Goal:** Verify all API connections and credentials are live before building full logic.

### Checklist
- [x] Email provider: **SMTP** (Phase 1 default)
- [x] Object storage: **S3-compatible** (Phase 1 default)
- [x] Auth: **Laravel Sanctum** (Phase 1 default)
- [x] `.env.example` created with all required keys (Laravel naming convention)
- [ ] Copy `.env.example` → `.env` and fill in real credentials
- [x] `tools/verify_email.py` — SMTP STARTTLS + test send
- [x] `tools/verify_storage.py` — S3 upload + presigned URL + delete
- [x] `tools/verify_db.py` — connect to MySQL 8.0, verify charset, confirm tables
- [ ] All 3 link checks pass ✅ before Phase 3 full build begins

---

## ⚙️ Phase 3: A — Architect (3-Layer Build)

**Goal:** Build the full system in layers. SOPs before code.

### Layer 1 — Architecture SOPs (`architecture/`) — COMPLETE ✅
- [x] `01_requisition_workflow.md` — States, transitions, guards
- [x] `02_vendor_quoting.md` — Quote collection, completeness rules
- [x] `03_approval_routing.md` — Step config, SLA, hold/reject/return logic
- [x] `04_document_generation.md` — DomPDF/Blade templates, maatwebsite/excel, Mark-as-Sent
- [x] `05_roles_and_permissions.md` — RBAC matrix, scope, Laravel Sanctum auth

### Layer 3 — Link Verification Scripts (`tools/`) — COMPLETE ✅
- [x] `tools/verify_db.py` — MySQL connection + charset + table check
- [x] `tools/verify_email.py` — SMTP STARTTLS + test send
- [x] `tools/verify_storage.py` — S3 upload + presigned URL + delete

### Full-Stack Application (Phase 3 Main Build — NEXT)
- [ ] **Backend:** `php artisan new` Laravel 11 in `backend/` + install:api
- [ ] MySQL schema migrations (`database/migrations/`)
- [ ] Eloquent models for all 13 entities
- [ ] Laravel Sanctum auth endpoints
- [ ] All API resource controllers + route definitions
- [ ] Workflow state machine logic (RequisitionWorkflowService)
- [ ] SLA timer service + scheduled command
- [ ] PDF generation (DomPDF + Blade templates)
- [ ] Excel export (maatwebsite/excel)
- [ ] Email notification jobs (Laravel Queues)
- [ ] **Frontend:** `npm create vite@latest frontend -- --template react` in `frontend/`
- [ ] Axios API client + TanStack Query setup
- [ ] React Router routes for all 10 modules
- [ ] All module components (M1–M10) built
- [ ] Mobile-responsive CSS
- [ ] Feature tests (Laravel) + component tests (React)

---

## ✨ Phase 4: S — Stylize

### Checklist
- [ ] PDF layouts polished (letterhead, tables, signatures)
- [ ] Dashboard design refined — mobile + desktop
- [ ] Approval inbox UX reviewed
- [ ] Cost comparison view finalized
- [ ] Audit timeline view implemented
- [ ] Email notification templates styled
- [ ] User acceptance review with user

---

## 🛰️ Phase 5: T — Trigger (Deployment)

### Checklist
- [ ] Choose hosting / cloud environment
- [ ] Containerize (Docker + docker-compose)
- [ ] CI/CD pipeline configured
- [ ] Production `.env` configured with live secrets
- [ ] Cron jobs set for SLA deadline notifications
- [ ] Webhook receivers configured (if applicable)
- [ ] `gemini.md` Maintenance Log finalized
- [ ] Project marked **COMPLETE** ✅

---

## 📌 Open Decisions
| # | Decision | Options | Status |
|---|---------|---------|--------|
| D1 | Email provider | SMTP / M365 / Google Workspace | ✅ SMTP (Phase 1) |
| D2 | Object storage | S3 / Azure Blob / GCP / MinIO | ✅ S3-compatible (Phase 1) |
| D3 | Identity / Auth | Sanctum / Azure AD / Google / Okta | ✅ Laravel Sanctum (Phase 1) |
| D4 | Backend framework | PHP Laravel 11 | ✅ LOCKED |
| D5 | Frontend framework | ReactJS (Vite) | ✅ LOCKED |
| D6 | Database | MySQL 8.0+ | ✅ LOCKED |
