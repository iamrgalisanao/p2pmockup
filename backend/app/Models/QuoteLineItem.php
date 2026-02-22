<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class QuoteLineItem extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'quote_id',
        'requisition_line_item_id',
        'unit_price',
        'line_total',
    ];

    protected $casts = [
        'unit_price' => 'decimal:4',
        'line_total' => 'decimal:4',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->id ??= Str::uuid()->toString());

        // Auto-calculate line_total = unit_price × requisition_line_item.quantity
        static::saving(function ($m) {
            $qty = $m->requisitionLineItem->quantity ?? 0;
            $m->line_total = bcmul($m->unit_price, $qty, 4);
        });

        // Trigger quote recalculation after save/delete
        static::saved(fn($m) => $m->quote->recalculate());
        static::deleted(fn($m) => $m->quote->recalculate());
    }

    public function quote(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(VendorQuote::class, 'quote_id');
    }

    public function requisitionLineItem(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(RequisitionLineItem::class, 'requisition_line_item_id');
    }
}
