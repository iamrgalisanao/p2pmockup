<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class PurchaseOrder extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'ref_number',
        'type',
        'requisition_id',
        'vendor_id',
        'awarded_quote_id',
        'issued_by',
        'issued_at',
        'subtotal',
        'tax',
        'grand_total',
        'delivery_terms',
        'payment_terms',
        'scope_of_work',
        'completion_date',
        'site_address',
        'status',
        'sent_at',
        'pdf_storage_key',
    ];

    protected $casts = [
        'issued_at' => 'datetime',
        'sent_at' => 'datetime',
        'completion_date' => 'date',
        'subtotal' => 'decimal:4',
        'tax' => 'decimal:4',
        'grand_total' => 'decimal:4',
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

    public function awardedQuote(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(VendorQuote::class, 'awarded_quote_id');
    }

    public function issuedBy(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    public function lineItems(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(PoLineItem::class)->orderBy('sort_order');
    }

    /**
     * Recalculate subtotal, tax (0% default Phase 1), grand_total.
     * SYSTEM-CALCULATED — never user-overridable.
     */
    public function recalculateTotals(float $taxRate = 0.0): void
    {
        $subtotal = $this->lineItems()->sum('line_total');
        $tax = bcmul((string) $subtotal, (string) $taxRate, 4);
        $this->subtotal = $subtotal;
        $this->tax = $tax;
        $this->grand_total = bcadd((string) $subtotal, (string) $tax, 4);
        $this->saveQuietly();
    }
}
