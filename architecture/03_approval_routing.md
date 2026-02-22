# SOP-03: Approval Routing
> **Layer 1 — Architecture SOP**
> Last Updated: 2026-02-21 | Status: APPROVED

---

## Purpose
Define the multi-step approval workflow: step sequence, role assignments, valid actions, SLA enforcement, and concurrency safety.

---

## Default Approval Chain

```
Step 1: Department Head Review
Step 2: Procurement Officer Review  (may be concurrent with Step 1 or sequential)
Step 3: Finance Reviewer Sign-off   (final gate before award)
```

> The approval chain is **configurable per department/project** in Phase 2. For Phase 1, the 3-step default is hardcoded.

---

## Approval Step Actions

| Action | Description | Comment Required? | SLA Effect |
|--------|-------------|-------------------|------------|
| `approved` | Step is cleared; next step is activated | No | SLA continues |
| `rejected` | Requisition is rejected; process stops | **Yes** | SLA stops |
| `returned` | Sent back to requester for revision; returns to `draft` | **Yes** | SLA resets to original |
| `on_hold` | Pauses at this step | **Yes** | SLA pauses |

### Comment Enforcement
- `rejected`, `returned`, `on_hold` → system blocks the action if `comment` field is empty or whitespace-only.
- Comments are stored on the `approval_step` record and echoed to `audit_log`.

---

## Concurrency Safety

**Rule:** One and only one action can be taken per approval step. (Rule R-04)

### Implementation: Optimistic Locking
1. Client reads `approval_step.version` when loading the inbox item.
2. On submit action: `UPDATE approval_steps SET action = ?, actioned_at = NOW(), version = version + 1 WHERE id = ? AND action = 'pending' AND version = ?`
3. If `rowcount == 0`: another actor already actioned this step. Return HTTP 409 Conflict to the client.
4. Client shows: "This item was already actioned by another user. Please refresh."

### Why DB-level, not App-level
Application-level checks (check-then-act) have a TOCTOU race condition. The WHERE clause check on `action = 'pending'` is atomic in PostgreSQL.

---

## Approval Inbox Behaviour

### Visibility
- An approver sees **only** the steps assigned to their role AND within their department/project scope.
- Steps from other departments are invisible.

### Step Activation
- Step N+1 is activated (becomes visible in inbox) only when Step N is `approved`.
- If Step N is `on_hold`, Step N+1 does not activate (the clock pauses at N).
- If Step N is `rejected`, all subsequent steps are cancelled.

### Delegation (Phase 2)
- Phase 1: No delegation. Approvals must be completed by a user with the required role.
- Phase 2: Delegate mapping table — approver A can delegate to B for a date range.

---

## SLA Configuration

| Step | Default SLA (business days) |
|------|---------------------------|
| Department Head Review | 2 |
| Procurement Officer Review | 3 |
| Finance Reviewer Sign-off | 2 |

- **SLA deadline** is an absolute UTC timestamp calculated at step activation: `activated_at + SLA_days × 86400s` (business-day-aware calculation in Phase 2; simple calendar days in Phase 1).
- **Breach notifications**: Email sent to approver + their supervisor at 80% of SLA elapsed, and again at breach.
- **Hold pauses SLA**: `sla_paused_at` recorded; on resume, `sla_deadline += (NOW() - sla_paused_at)`.

---

## Escalation (Phase 2)
- If SLA is breached and no action taken within 24h after breach, auto-escalate to supervisor.
- Escalation is logged in `audit_log` with `action = 'sla_escalated'`.

---

## Email Notifications on Approval Events

| Event | Recipient(s) |
|-------|-------------|
| Step activated (step pending) | Assigned approver role(s) in scope |
| Approved | Requester + next step approver |
| Rejected | Requester + procurement officer |
| Returned | Requester |
| On Hold | Requester + procurement supervisor |
| SLA 80% warning | Approver |
| SLA breached | Approver + their supervisor |

---

## Edge Cases

| Scenario | Handling |
|---------|---------|
| Approver is also the requester | Allowed in Phase 1 (conflict-of-interest enforcement in Phase 2) |
| No user with required role exists | Step is unassignable; admin must assign a user or escalate |
| Approval after requisition cancelled | Block — cancelled requisitions have no actionable steps |
| Finance review before dept approval | Block — Step 3 cannot activate before Step 2 |
