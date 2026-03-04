<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class GrnLineItem extends Model
{
    use HasUuids;

    protected $fillable = [
        'grn_id',
        'po_line_item_id',
        'quantity_received',
        'remarks',
    ];

    public function grn(): BelongsTo
    {
        return $this->belongsTo(Grn::class);
    }

    public function poLineItem(): BelongsTo
    {
        return $this->belongsTo(PoLineItem::class);
    }
}
