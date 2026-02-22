<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class NoticeToAward extends Model
{
    protected $table = 'notices_to_award';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'ref_number',
        'requisition_id',
        'vendor_id',
        'awarded_quote_id',
        'award_basis',
        'override_justification',
        'override_authorized_by',
        'issued_by',
        'issued_at',
        'pdf_storage_key',
        'status',
        'sent_at',
    ];

    protected $casts = [
        'issued_at' => 'datetime',
        'sent_at' => 'datetime',
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

    public function overrideAuthorizedBy(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'override_authorized_by');
    }
}
