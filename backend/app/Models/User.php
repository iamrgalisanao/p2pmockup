<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Str;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'email',
        'password',
        'role',
        'department_id',
        'supervisor_id',
        'project_ids',
        'is_active',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'project_ids' => 'array',
        'is_active' => 'boolean',
        'supervisor_id' => 'string',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->id ??= Str::uuid()->toString());
    }

    // ── Relationships ──────────────────────────────────────────────────────

    public function department(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function requisitions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Requisition::class, 'requested_by');
    }

    public function approvalSteps(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ApprovalStep::class, 'approver_id');
    }

    public function supervisor(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function subordinates(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(User::class, 'supervisor_id');
    }

    // ── Role Helpers ───────────────────────────────────────────────────────

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
    public function isProcOfficer(): bool
    {
        return $this->role === 'proc_officer';
    }
    public function isDeptHead(): bool
    {
        return $this->role === 'dept_head';
    }
    public function isFinance(): bool
    {
        return $this->role === 'finance_reviewer';
    }
    public function isRequester(): bool
    {
        return $this->role === 'requester';
    }
    public function isFinanceHead(): bool
    {
        return $this->role === 'finance_head';
    }
    public function isCoo(): bool
    {
        return $this->role === 'coo';
    }

    public function hasRole(string ...$roles): bool
    {
        return in_array($this->role, $roles);
    }

    /**
     * Sanctum token abilities by role.
     * Admin gets wildcard; others get specific ability sets.
     */
    public function sanctumAbilities(): array
    {
        return match ($this->role) {
            'admin' => ['*'],
            'proc_officer' => [
                'requisition:view',
                'requisition:route',
                'quote:manage',
                'vendor:manage',
                'approval:act:proc_officer',
                'document:generate',
                'document:mark-sent',
                'report:export',
            ],
            'dept_head' => [
                'requisition:view',
                'requisition:create',
                'requisition:submit',
                'approval:act:dept_head',
                'document:generate',
                'report:export',
            ],
            'finance_reviewer' => [
                'requisition:view',
                'approval:act:finance_reviewer',
                'document:generate',
                'report:export',
            ],
            'president' => [
                'requisition:view',
                'approval:act:president',
                'document:generate',
                'report:export',
            ],
            'accounting_staff' => [
                'requisition:view',
                'approval:act:accounting_staff',
                'document:generate',
                'report:export',
            ],
            'accounting_supervisor' => [
                'requisition:view',
                'approval:act:accounting_supervisor',
                'document:generate',
                'report:export',
            ],
            'accounting_manager' => [
                'requisition:view',
                'approval:act:accounting_manager',
                'document:generate',
                'report:export',
            ],
            'requester' => [
                'requisition:create',
                'requisition:view',
                'requisition:submit',
            ],
            'finance_head' => [
                'requisition:view',
                'approval:act:finance_head',
                'document:generate',
                'report:export',
            ],
            'coo' => [
                'requisition:view',
                'approval:act:coo',
                'document:generate',
                'report:export',
            ],
            default => [],
        };
    }

    /**
     * Scope: only see records within this user's department/project scope.
     * Admin and proc_officer see everything.
     */
    public function canSeeRequisition(Requisition $r): bool
    {
        // Global visibility roles
        if (
            in_array($this->role, [
                'admin',
                'president',
                'proc_officer',
                'finance_reviewer',
                'finance_head',
                'coo',
                'accounting_staff',
                'accounting_supervisor',
                'accounting_manager'
            ])
        ) {
            return true;
        }

        // Users can always see requisitions they created
        if ($r->requested_by === $this->id) {
            return true;
        }

        // Users can see requisitions from their own department
        if ($r->department_id === $this->department_id) {
            return true;
        }

        // Users can see requisitions from projects they are assigned to
        $projectIds = $this->project_ids ?? [];
        return $r->project_id && in_array($r->project_id, $projectIds);
    }
}
