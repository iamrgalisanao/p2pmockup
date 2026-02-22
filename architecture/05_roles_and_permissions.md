# SOP-05: Roles & Permissions
> **Layer 1 — Architecture SOP**
> Last Updated: 2026-02-21 | Status: APPROVED
> **Stack: PHP Laravel 11 + Laravel Sanctum**

---

## Purpose
Define the RBAC (Role-Based Access Control) matrix, scope enforcement rules, and all permission boundaries for the P2P system.

---

## Roles

| Role | Code | Description |
|------|------|-------------|
| Requester | `requester` | Creates and submits PRs within their department/project scope |
| Department Head | `dept_head` | Reviews and approves/rejects PRs from their department |
| Procurement Officer | `proc_officer` | Manages the quoting process, evaluation, and workflow routing |
| Finance Reviewer | `finance_reviewer` | Final financial sign-off before award |
| Administrator | `admin` | Full access; manages users, lookup data, and configuration |

---

## Scope Enforcement (Rule R-03)

Every user is assigned:
- `department_id` — their home department
- `project_ids[]` — list of projects they are scoped to (may be empty)

**Visibility rule:** A user can only see requisitions where:
- `requisition.department_id = user.department_id`, OR
- `requisition.project_id IN user.project_ids`

**Exception:** `admin` and `proc_officer` see all requisitions across all departments/projects.

---

## Permission Matrix

| Action | requester | dept_head | proc_officer | finance_reviewer | admin |
|--------|:---------:|:---------:|:------------:|:----------------:|:-----:|
| Create PR (own dept) | ✅ | ✅ | ✅ | ❌ | ✅ |
| Edit PR (draft only, own) | ✅ | ✅ | ✅ | ❌ | ✅ |
| View PR (own scope) | ✅ | ✅ | ✅ | ✅ | ✅ |
| View PR (all) | ❌ | ❌ | ✅ | ❌ | ✅ |
| Submit PR | ✅ | ✅ | ✅ | ❌ | ✅ |
| Cancel PR | ❌ | ✅ | ✅ | ❌ | ✅ |
| Enter Vendor Quote | ❌ | ❌ | ✅ | ❌ | ✅ |
| Mark Quote Compliant/Non-compliant | ❌ | ❌ | ✅ | ❌ | ✅ |
| Approve (Dept Head step) | ❌ | ✅ | ❌ | ❌ | ✅ |
| Approve (Proc Officer step) | ❌ | ❌ | ✅ | ❌ | ✅ |
| Approve (Finance step) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Reject / Return / Hold | per role | per role | ✅ | ✅ | ✅ |
| Approve Quote Exception (<3) | ❌ | ✅ | ❌ | ❌ | ✅ |
| Make Award Decision | ❌ | ❌ | ✅ | ❌ | ✅ |
| Authorize Award Override | ❌ | ✅ | ❌ | ❌ | ✅ |
| Generate PDF | ❌ | ✅ | ✅ | ✅ | ✅ |
| Mark as Sent (PO/JO/NTA) | ❌ | ❌ | ✅ | ❌ | ✅ |
| Export Excel | ❌ | ✅ | ✅ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage Vendors | ❌ | ❌ | ✅ | ❌ | ✅ |
| Manage Departments / Projects | ❌ | ❌ | ❌ | ❌ | ✅ |
| View Audit Log | ❌ | ✅ (own dept) | ✅ | ✅ (own) | ✅ |
| Manage Checklist Config | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Authentication (Phase 1 — Laravel Sanctum)

**Package:** `laravel/sanctum` (included in Laravel 11 by default)

### Token Flow
1. User submits `email` + `password` to `POST /api/auth/login`.
2. Laravel `Auth::attempt()` verifies credentials against `users` table (bcrypt).
3. On success, Sanctum issues a **personal access token** (opaque, stored hashed in `personal_access_tokens` table).
4. Token is returned to the client once and stored in browser `localStorage` or secure cookie.
5. All subsequent requests send: `Authorization: Bearer {token}` header.
6. Logout: `DELETE /api/auth/logout` → `$request->user()->currentAccessToken()->delete()`.

### Sanctum Configuration (`config/sanctum.php`)
```php
'expiration' => 60 * 24,      // 24 hours in minutes (Phase 1)
'token_prefix' => 'p2p_',    // Prefix for easy identification
```

### User Model Additions
```php
// app/Models/User.php
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;
    // ... roles, department_id, project_ids stored in users table
}
```

### Token Abilities (Scopes by Role)
```php
// Issued token carries abilities based on role
$token = $user->createToken('auth', $user->sanctumAbilities())->plainTextToken;

// Abilities map:
// requester       → ['requisition:create', 'requisition:view', 'requisition:submit']
// dept_head       → ['requisition:approve', 'requisition:view', ...]
// proc_officer    → ['quote:manage', 'vendor:manage', 'requisition:route', ...]
// finance_reviewer→ ['requisition:approve-finance', ...]
// admin           → ['*']   (all abilities)
```

### Password Rules
- Minimum 12 characters
- Must contain: uppercase, lowercase, digit, special character
- Stored as **bcrypt** via Laravel `Hash::make()` (cost factor 12) — never plaintext

### Session Invalidation
- Logout: delete current token via `currentAccessToken()->delete()`.
- Password change: `$user->tokens()->delete()` — revokes all tokens.
- Admin deactivate user: `$user->update(['is_active' => false])` + `$user->tokens()->delete()`.

---

## HTTP API Authorization Pattern (Laravel)

All protected endpoints follow this middleware + policy chain:
```
Request
  → `auth:sanctum` middleware  (validates Bearer token)
  → `EnsureUserIsActive` middleware  (checks is_active = true)
  → `CheckRole` middleware  (does user.role have permission?)
  → `CheckScope` middleware  (is entity within user's dept/project scope?)
  → Controller Action
  → Response
```

### Laravel Route Example
```php
// routes/api.php
Route::middleware(['auth:sanctum', 'active', 'role:proc_officer,admin'])
    ->group(function () {
        Route::post('/requisitions/{id}/route', [WorkflowController::class, 'route']);
    });
```

If any check fails: return `403 Forbidden` with JSON body:
```json
{ "error": "INSUFFICIENT_ROLE", "message": "This action requires procurement_officer role" }
```

---

## Audit Log Access

Audit logs are **append-only** and **never deletable** by any role including admin.

| Role | What they can query |
|------|-------------------|
| requester | Only their own PRs |
| dept_head | All PRs in their department |
| proc_officer | All PRs |
| finance_reviewer | PRs they acted on |
| admin | Full audit log |

---

## Edge Cases

| Scenario | Handling |
|---------|---------|
| User transferred to another dept | Update `department_id`; they lose access to old dept's PRs |
| User deactivated | `is_active = false`; all tokens revoked; login blocked |
| Admin deletes own account | Blocked — at least 1 admin must exist at all times |
| Role escalation attack | JWT claims are signed — cannot be modified client-side |
| Approver is also the requester | Allowed Phase 1; flagged in audit log as `self_approval_risk = true` |
