<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PaymentRequest extends Model
{
    use HasUuids;

    protected $fillable = [
        'ref_number',
        'request_type',
        'requisition_id',
        'po_jo_id',
        'title',
        'particulars',
        'payee_name',
        'vendor_id',
        'amount',
        'due_date',
        'payment_terms',
        'department_id',
        'cost_center',
        'gl_suggestion',
        'tax_code',
        'withholding_tax',
        'status',
        'accounting_validated_by',
        'accounting_validated_at',
        'apv_number',
        'cv_number',
        'check_number',
        'available_date',
        'release_date',
        'sap_sync_status',
        'sap_error',
        'requested_by',
        'version'
    ];

    protected $casts = [
        'due_date' => 'date',
        'available_date' => 'date',
        'release_date' => 'date',
        'amount' => 'decimal:4',
        'accounting_validated_at' => 'datetime',
        'version' => 'integer'
    ];

    public function accountingValidator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'accounting_validated_by');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function requisition(): BelongsTo
    {
        return $this->belongsTo(Requisition::class);
    }

    public function poJo(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class, 'po_jo_id');
    }

    public function lineItems(): HasMany
    {
        return $this->hasMany(PaymentLineItem::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(PaymentApproval::class)->orderBy('step_number');
    }
}
