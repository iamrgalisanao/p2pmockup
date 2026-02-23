<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Requisition extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'ref_number',
        'request_type',
        'po_number',
        'title',
        'particulars',
        'department_id',
        'cost_center',
        'project_id',
        'requested_by',
        'date_needed',
        'priority',
        'description',
        'estimated_total',
        'checklist_satisfied',
        'status',
        'hold_reason',
        'sla_deadline',
        'sla_paused',
        'sla_paused_at',
        'version',
    ];

    protected $casts = [
        'date_needed' => 'date',
        'estimated_total' => 'decimal:4',
        'checklist_satisfied' => 'boolean',
        'sla_deadline' => 'datetime',
        'sla_paused' => 'boolean',
        'sla_paused_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($m) {
            $m->id ??= Str::uuid()->toString();
            $m->version ??= 1;
        });
    }

    // ── Relationships ──────────────────────────────────────────────────────

    public function department(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function project(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Department::class, 'project_id');
    }

    public function requester(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function lineItems(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(RequisitionLineItem::class)->orderBy('sort_order');
    }

    public function attachments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Attachment::class, 'entity_id')
            ->where('entity_type', 'requisition');
    }

    public function quotes(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(VendorQuote::class);
    }

    public function approvalSteps(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ApprovalStep::class)->orderBy('step_number');
    }

    public function currentApprovalStep(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(ApprovalStep::class)->where('action', 'pending')->orderBy('step_number');
    }

    public function noticeToAward(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(NoticeToAward::class);
    }

    public function purchaseOrder(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(PurchaseOrder::class);
    }

    public function auditLogs(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(AuditLog::class, 'entity_id')
            ->where('entity_type', 'requisition')
            ->orderBy('created_at', 'desc');
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    /**
     * Recalculate estimated_total from line items.
     * Called after any line item change. SYSTEM-CALCULATED.
     */
    public function recalculateTotal(): void
    {
        $this->estimated_total = $this->lineItems()->sum('line_total');
        $this->saveQuietly();
    }

    /**
     * Check if all required document types are attached.
     * SYSTEM-CALCULATED — updates checklist_satisfied.
     */
    public function updateChecklistStatus(array $requiredDocTypes): void
    {
        $attached = $this->attachments()->pluck('doc_type')->toArray();
        $satisfied = empty(array_diff($requiredDocTypes, $attached));
        $this->checklist_satisfied = $satisfied;
        $this->saveQuietly();
    }

    /**
     * Resume SLA after a hold — recalculates sla_deadline.
     */
    public function resumeSla(): void
    {
        if ($this->sla_paused && $this->sla_paused_at) {
            $elapsed = now()->diffInSeconds($this->sla_paused_at);
            $this->sla_deadline = $this->sla_deadline->addSeconds($elapsed);
            $this->sla_paused = false;
            $this->sla_paused_at = null;
            $this->save();
        }
    }

    /**
     * Count responsive quotes (complete + compliant).
     */
    public function responsiveQuoteCount(): int
    {
        return $this->quotes()
            ->where('is_complete', true)
            ->where('is_compliant', true)
            ->count();
    }

    /**
     * Get the lowest responsive quote.
     */
    public function lowestQuote(): ?VendorQuote
    {
        return $this->quotes()
            ->where('is_complete', true)
            ->where('is_compliant', true)
            ->orderBy('grand_total', 'asc')
            ->first();
    }
}
