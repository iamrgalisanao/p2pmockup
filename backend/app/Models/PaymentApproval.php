<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Support\Facades\DB;
use Exception;

class PaymentApproval extends Model
{
    use HasUuids;

    protected $fillable = [
        'payment_request_id',
        'step_number',
        'step_label',
        'role_required',
        'actioned_by',
        'action',
        'comment',
        'actioned_at',
        'sla_deadline',
        'is_sla_breached'
    ];

    protected $casts = [
        'step_number' => 'integer',
        'actioned_at' => 'datetime',
        'sla_deadline' => 'datetime',
        'is_sla_breached' => 'boolean'
    ];

    public function paymentRequest(): BelongsTo
    {
        return $this->belongsTo(PaymentRequest::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actioned_by');
    }

    /**
     * Perform an action on the step (approved, rejected, etc.)
     * Uses optimistic locking (check action is pending).
     */
    public function performAction(string $action, ?string $comment = null, $user = null)
    {
        return DB::transaction(function () use ($action, $comment, $user) {
            // Reload to ensure freshness
            $this->refresh();

            if ($this->action !== 'pending') {
                return false;
            }

            $this->action = $action;
            $this->comment = $comment;
            $this->actioned_by = $user?->id;
            $this->actioned_at = \Illuminate\Support\Carbon::now();

            return $this->save();
        });
    }
}
