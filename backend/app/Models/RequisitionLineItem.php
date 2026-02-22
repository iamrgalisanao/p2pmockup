<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class RequisitionLineItem extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'requisition_id',
        'description',
        'gl_account_code',
        'account_name',
        'gl_category',
        'budget_line_item',
        'vat_type',
        'wht_type',
        'specification',
        'unit',
        'quantity',
        'estimated_unit_cost',
        'gross_price',
        'net_price',
        'line_total',
        'sort_order',
    ];

    protected $casts = [
        'quantity' => 'decimal:4',
        'estimated_unit_cost' => 'decimal:4',
        'line_total' => 'decimal:4',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->id ??= Str::uuid()->toString());

        // Auto-calculate line_total on create/update
        static::saving(function ($m) {
            $vatRate = $m->vat_type === '12% VAT' ? 0.12 : 0;
            $whtRate = 0;
            if ($m->wht_type === '1% WHT')
                $whtRate = 0.01;
            elseif ($m->wht_type === '2% WHT')
                $whtRate = 0.02;

            $m->gross_price = round($m->estimated_unit_cost, 2);

            // Calculate Net Price: Unit Cost - WHT (if applicable) + VAT (if applicable)
            // Note: In CRIS, VAT is usually on top of net, but we'll follow the requested formula:
            // Net Price = Unit Cost * (1 + VAT - WHT)
            $m->net_price = round($m->gross_price * (1 + $vatRate - $whtRate), 2);
            $m->line_total = round($m->quantity * $m->net_price, 2);
        });

        // After save, trigger requisition total recalculation
        static::saved(fn($m) => $m->requisition->recalculateTotal());
        static::deleted(fn($m) => $m->requisition->recalculateTotal());

    }

    public function requisition(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Requisition::class);
    }

    public function quoteLineItems(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(QuoteLineItem::class, 'requisition_line_item_id');
    }
}
