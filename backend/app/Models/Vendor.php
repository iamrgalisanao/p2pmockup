<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Vendor extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'contact_person',
        'email',
        'phone',
        'address',
        'tax_id',
        'accreditation_status',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->id ??= Str::uuid()->toString());
    }

    public function quotes(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(VendorQuote::class, 'vendor_id');
    }

    public function noticestoAward(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(NoticeToAward::class, 'vendor_id');
    }

    public function purchaseOrders(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(PurchaseOrder::class, 'vendor_id');
    }
}
