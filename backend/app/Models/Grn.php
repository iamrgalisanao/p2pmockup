<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Grn extends Model
{
    use HasUuids;

    protected $fillable = [
        'ref_number',
        'purchase_order_id',
        'received_date',
        'received_by',
        'remarks',
        'status',
    ];

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function lineItems(): HasMany
    {
        return $this->hasMany(GrnLineItem::class);
    }
}
