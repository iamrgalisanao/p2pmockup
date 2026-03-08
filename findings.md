# 🔍 findings.md — Research & Discoveries

> **Purpose:** Capture research findings, external resources, API quirks, constraints, and discoveries.

---

## 📅 Log

### 2026-02-21 — Discovery Q&A Complete + Schema Locked

**System Type:** Full Procure-to-Pay (P2P) procurement system
**Critical finding:** This is a **regulated workflow system** — the audit trail and concurrency safety are not optional. They must be built into the DB layer, not bolted on later.

---

## 🏗️ Architecture Findings

### Database Design Insights
- **Optimistic locking** (version field on requisition) is the correct concurrency pattern for approval actions. Read `version`, check hasn't changed, act — else reject with "Record was modified" error.
- **Audit log must be append-only.** PostgreSQL trigger approach (write to `audit_log` on every UPDATE to core tables) is the most reliable pattern — it can't be bypassed by application bugs.
- **Status machine enforcement** should be done at the DB layer (check constraint or stored procedure), not only in application code. Application code can have bugs; DB constraints cannot be bypassed.
- **SLA timer logic:** Use absolute `sla_deadline` timestamps, not countdown timers. "Hold" = record `sla_paused_at`; "Resume" = add `(NOW() - sla_paused_at)` to `sla_deadline`.

### PDF Generation
- **WeasyPrint** (Python) or **Puppeteer** (Node) are the two best open-source options for HTML→PDF.
  - WeasyPrint: pure Python, no browser dependency. Good for server-side batch.
  - Puppeteer: requires headless Chrome. Pixel-perfect but heavier.
  - **Recommendation:** WeasyPrint for Phase 1 (simpler deployment).
- **ReportLab** is also an option but requires layout code — less flexible for rich HTML templates.

### Excel Export
- **openpyxl** (Python) for template-based Excel generation. Load a `.xlsx` template, populate cells, save.
- Alternatively: generate CSV + apply formatting via openpyxl.

### Email
- **SMTP + smtplib** (Python stdlib) works for Phase 1.
- **SendGrid / Mailgun** are recommended for production (delivery tracking, retries, open tracking).
- Microsoft 365 SMTP: uses OAuth2 or app passwords. Modern auth requires OAuth2 — not just credentials.

### Object Storage
- **boto3** (Python AWS SDK) works for: AWS S3, MinIO, Backblaze B2, DigitalOcean Spaces, GCP (with compatibility mode), Cloudflare R2 — all S3-compatible.
- Presigned URLs allow secure, time-limited direct access without exposing the bucket publicly.

---

## 🌐 Relevant Open-Source References

| Resource | URL | Relevance |
|----------|-----|----------|
| Laravel 11 | https://laravel.com/docs/11.x | Backend framework |
| Laravel Sanctum | https://laravel.com/docs/11.x/sanctum | API token auth |
| barryvdh/laravel-dompdf | https://github.com/barryvdh/laravel-dompdf | PDF generation |
| maatwebsite/excel | https://laravel-excel.com | Excel export |
| league/flysystem-aws-s3-v3 | https://flysystem.thephpleague.com | S3 file storage |
| ReactJS (Vite) | https://vitejs.dev | Frontend build |
| TanStack Query | https://tanstack.com/query | Server state (React) |
| React Router v6 | https://reactrouter.com | Frontend routing |
| Zustand | https://github.com/pmndrs/zustand | UI state management |
| Axios | https://axios-http.com | HTTP client |
| MySQL 8.0 | https://dev.mysql.com/doc/refman/8.0/en/ | Database |
| spatie/laravel-pdf | https://github.com/spatie/laravel-pdf | Alt PDF (Chromium) |

---

## ⚠️ Constraints & Gotchas

| Constraint | Details | Mitigation |
|-----------|---------|-----------|
| MySQL no `RETURNING` | Cannot return inserted row in same statement | Use Eloquent `$model->id` after `save()` |
| Concurrency on approvals | Two approvers could click simultaneously | Optimistic locking: `version` column + `affectingStatement()` check |
| Audit log immutability | Must NEVER be updated/deleted | App-layer: never call update/delete on `audit_logs`. DB-layer: restrict user privileges to INSERT only |
| M365 SMTP auth | Modern auth requires OAuth2, not just username/password | Use app password or OAuth2 flow |
| SLA during holds | Clock must pause on hold, resume on release | Store `sla_paused_at`; adjust deadline with `TIMESTAMPDIFF` on resume |
| File size limits | Large attachments (BOQ PDFs) | Set `upload_max_filesize` in `php.ini`; enforce max in Laravel validation |
| DomPDF + CSS | DomPDF does not support Flexbox/Grid | Use HTML tables in Blade PDF templates |
| MySQL utf8 vs utf8mb4 | Standard `utf8` in MySQL is 3-byte only | Always use `utf8mb4` charset + `utf8mb4_unicode_ci` collation |
| UUID in MySQL | No native UUID primary key type | Use `CHAR(36)` with `Str::uuid()` in Eloquent model boot |
| PHP memory + large PDFs | PHP default memory limit may be too low | Set `memory_limit = 256M` in `php.ini` or per-request in controller |

---

## 💡 Discoveries

### 2026-03-08
- **ERP-First Entry (R-12)**: The new client workflow places SAP entry *ahead* of internal P2P approvals. This makes the P2P system a "Workflow Wrapper" around SAP records, ensuring that only verified ERP data enters the signature chain.
- **Audit-Safe Reactivation (R-13)**: The decision to clone requisitions upon reactivation (rather than resetting status) ensures that the "cancelled" state is never overwritten. Each PR lifecycle is unique, and revisions are linked via `reactivated_from_id`.
- **Systematic Scoping (R-03)**: Using global Eloquent scopes for row-level security (RLS) is superior to manual controller filtering. It protects against "ID enumeration" attacks and ensures developers can't accidentally leak data between departments.
- **SPA Deployment (Apache)**: When deploying React SPAs using Apache's Alias directive, absolute API paths and a custom `.htaccess` RewriteBase are necessary to prevent 404s on browser reloads and API proxying issues.
