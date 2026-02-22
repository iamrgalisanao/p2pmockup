<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class VendorQuote extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'requisition_id',
        'vendor_id',
        'submitted_by',
        'grand_total',
        'is_complete',
        'is_compliant',
        'compliance_notes',
        'notes',
        'is_awarded',
    ];

    protected $casts = [
        'grand_total' => 'decimal:4',
        'is_complete' => 'boolean',
        'is_compliant' => 'boolean',
        'is_awarded' => 'boolean',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->id ??= Str::uuid()->toString());
    }

    public function requisition(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Requisition::class);
    }

    public function vendor(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function submittedBy(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function lineItems(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(QuoteLineItem::class, 'quote_id');
    }

    public function attachments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Attachment::class, 'entity_id')
            ->where('entity_type', 'quote');
    }

    /**
     * Recalculate grand_total and is_complete flag.
     * Called after any QuoteLineItem change. SYSTEM-CALCULATED.
     */
    public function recalculate(): void
    {
        $lineItemCount = $this->requisition->lineItems()->count();
        $pricedCount = $this->lineItems()->whereNotNull('unit_price')->count();

        $this->grand_total = $this->lineItems()->sum('line_total');
        $this->is_complete = ($pricedCount === $lineItemCount && $lineItemCount > 0);
        $this->saveQuietly();
    }

    /** True if this quote meets the "lowest responsive bid" criteria. */
    public function isResponsive(): bool
    {
        return $this->is_complete && $this->is_compliant === true;
    }
}
