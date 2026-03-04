<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Department extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'code',
        'type',
        'parent_id',
        'budget_limit',
        'is_active',
    ];

    protected $casts = [
        'budget_limit' => 'decimal:4',
        'is_active' => 'boolean',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->id ??= Str::uuid()->toString());
    }

    public function parent(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Department::class, 'parent_id');
    }

    public function children(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Department::class, 'parent_id');
    }

    public function users(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(User::class, 'department_id');
    }

    public function requisitions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Requisition::class, 'department_id');
    }

    public function budgetLedgers(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(BudgetLedger::class, 'department_id');
    }

    public function projectLedgers(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(BudgetLedger::class, 'project_id');
    }

    // ── Budget Utilities ──────────────────────────────────────────────────

    public function getPreEncumberedAmount(): float
    {
        return (float) BudgetLedger::where('department_id', $this->id)
            ->where('type', 'pre_encumbrance')
            ->sum('amount');
    }

    public function getEncumberedAmount(): float
    {
        return (float) BudgetLedger::where('department_id', $this->id)
            ->whereIn('type', ['encumbrance', 'adjustment'])
            ->whereNotNull('purchase_order_id')
            ->sum('amount');
    }

    public function getActualSpentAmount(): float
    {
        return (float) BudgetLedger::where('department_id', $this->id)
            ->where('type', 'actual')
            ->sum('amount');
    }

    public function getAvailableBudget(): float
    {
        $consumed = BudgetLedger::where('department_id', $this->id)->sum('amount');
        return (float) ($this->budget_limit - $consumed);
    }
}
