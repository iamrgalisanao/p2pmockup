<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PaymentLineItem extends Model
{
    use HasUuids;

    protected $fillable = [
        'payment_request_id',
        'description',
        'gl_account_code',
        'gl_category',
        'quantity',
        'unit_cost',
        'vat_type',
        'wht_type',
        'gross_price',
        'net_price',
        'line_total'
    ];

    protected $casts = [
        'quantity' => 'decimal:4',
        'unit_cost' => 'decimal:2',
        'gross_price' => 'decimal:2',
        'net_price' => 'decimal:2',
        'line_total' => 'decimal:2'
    ];

    public function paymentRequest(): BelongsTo
    {
        return $this->belongsTo(PaymentRequest::class);
    }
}
