<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class BudgetLedger extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'department_id',
        'project_id',
        'requisition_id',
        'purchase_order_id',
        'payment_request_id',
        'type',
        'amount',
        'description',
        'reference_number',
    ];

    protected $casts = [
        'amount' => 'decimal:4',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->id ??= Str::uuid()->toString());
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'project_id');
    }

    public function requisition(): BelongsTo
    {
        return $this->belongsTo(Requisition::class);
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function paymentRequest(): BelongsTo
    {
        return $this->belongsTo(PaymentRequest::class);
    }
}
