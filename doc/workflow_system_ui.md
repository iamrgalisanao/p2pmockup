# Workflow System UI Specification (MVP)

---

# 1) Global Information Architecture

## Primary Modules (Left Navigation)

- **Dashboard**
- **Procurement Requests**
- **Purchase Orders / Awards**
- **Payment Requests**
- **Approvals**
- **Monitoring**
- **Reports**
- **Admin** (System Admin only)

---

# 2) Screen Inventory (MVP)

---

## A) Auth & Shell

### Login

### Role Switch / Department Context Selector
(If user has multiple scopes)

### Global Layout
- Left navigation
- Top bar (notifications, profile)
- Global search
- Quick create button

---

## B) Procurement Workflow (Phase 1) Screens

### Procurement Requests – List
**Filters:**
- Status
- Department
- Amount range
- Date
- Assigned to
- Vendor status

**Quick Actions:**
- View
- Edit (if draft/returned)
- Duplicate
- Export PDF

---

### Create Procurement Request (Wizard)

**Step 1: Request Details**
- Type
- Justification
- Cost center / department
- Needed-by date

**Step 2: Items / Services**
- Line items
- Quantity
- Specifications

**Step 3: Attachments**
- Enforce “single PDF packet” rule (if required)

**Step 4: Review & Submit**

---

### Procurement Request – Detail (Read/Work View)

**Header:**
- Request ID
- Requester
- Department
- Total
- Status

**Tabs:**
- Summary
- Items / Scope
- Attachments
- Approvals timeline
- Vendor sourcing & cost comparison
- Audit log

---

### Return for Edit (Modal / Form)

**Required:**
- Reason category
- Comments

**Optional:**
- Attach markup / notes

---

### Vendor Sourcing – Manage Vendors

- Add vendor candidates (≥3)

**Capture:**
- Vendor name
- Quote amount
- Lead time
- Compliance notes
- Attachments

Optional:
- “Request quote” email template button

---

### Cost Comparison – Builder

- Auto-compare vendor quotes by line and totals
- Procurement Specialist recommendation section
- Generates a “Cost Comparison PDF” artifact attached to the request

---

### Create Purchase/Job Order (From Approved Request)

- Pre-filled from best option
- Final review

**Output:**
- Notice to Award (PDF)
- PO/JO document (PDF + SAP B1 integration status)

---

### PO/JO Detail

- SAP B1 references (DocEntry / DocNum)
- Status lifecycle:
  - Draft
  - Sent
  - Accepted
  - Closed

---

## C) Payment / Check Request Flow (CRIS Replacement)

### Payment Requests – List

**Filters:**
- PO-based vs Non-PO
- Status
- Payee
- Due date
- Amount

**Indicators:**
- Missing documents
- Overdue approval
- SAP sync failed

---

### Create Payment Request (Wizard)

**Step 1: Request Type**
- PO
- Non-PO
- Reimbursement
- Cash Advance

**Step 2: Payee + Payment Details**
- Amount
- Due date
- Terms

**Step 3: Accounting Details**
- Cost center
- GL suggestion
- Tax code / Withholding tax

**Step 4: Attachments**
- Single PDF packet

**Step 5: Review & Submit**

---

### Payment Request – Detail

**Tabs:**
- Summary
- Attachments
- Accounting coding
- Approval timeline
- SAP B1 sync status
- Check milestones:
  - APV #
  - Posting date
  - CV #
  - Check #
  - Available date
  - Release date
- Audit log

---

### Checks – List / Monitoring

(Mirrors CRIS “My Requests → Checks”)

**Columns:**
- Payee
- Amount
- Check #
- Available date
- Release date
- Status

---

## D) Approvals (All Roles)

### Approvals Inbox (To Approve)

- Unified queue (procurement + payment)
- Batch approve (configurable)
- SLA indicators
- Escalation badges

---

### Approval Review Screen

**Side-by-Side Layout:**
- Request summary + key fields
- Embedded PDF viewer for attachment packet

**Decision Buttons:**
- Approve
- Return
- Reject
- Hold (where applicable)

Required:
- Comment on Return / Reject / Hold

---

### My Decisions / History

- Approved list
- Returned list
- Rejected list
- Notes + timestamps

---

## E) Monitoring & Reporting

### My Requests Dashboard

**Tiles:**
- Drafts
- Returned
- Pending Approval
- In Process
- Completed

**Charts:**
- Cycle time by stage
- Aging buckets

---

### Org Monitoring Dashboard (Managers)

- Work-in-progress by department
- Bottlenecks by approver role
- High-value (≥1M) queue visibility

---

### Reports

Exportable reports:
- Procurement cycle time
- Vendor comparison
- Payment aging
- Check release aging

---

## F) Admin (System Admin)

### Users & Roles
- Create / edit users
- Assign roles
- Assign department
- Configure approver mapping

---

### Workflow Configuration
- Threshold rules (≥1M)
- Routing chains
- Hold rules

---

### Master Data Mapping
- Departments
- Cost centers
- GL / tax mapping tables (if needed)

---

### Integration Monitoring
- SAP B1 sync queue
- Failed jobs
- Retry controls
- Webhook logs

---

# 3) Critical UI Patterns (Usability Standards)

## Standard “Request Detail” Layout

**Header Summary Strip:**
- Status
- Amount
- Owner
- Due date
- SLA indicator

**Primary Actions (Contextual):**
- Submit
- Resubmit
- Approve
- Return
- Reject
- Hold

**Right Rail:**
- Approval timeline
- Key metadata

**Main Tabs:**
- Summary
- Attachments
- Lines
- Approvals
- Audit
- Integration

---

## Attachments UX (CRIS-Compatible)

Upload control that:
- Enforces single PDF (if required by policy)
- Shows “packet completeness checklist” (optional)
- Supports versioning (v1, v2 after return)

---

# 4) Next UX Deliverable (Select One)

1. MVP Screen Map + User Flows  
2. Wireframe specs per screen (fields, validations, states)  
3. Design system starter (components, statuses, badges, typography)  
4. AI UI generation prompt (v0 / Lovable style)  
5. Front-end spec for developers (routes, permissions matrix, API contracts)