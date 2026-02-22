<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class ApprovalStep extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'requisition_id',
        'step_number',
        'step_label',
        'role_required',
        'approver_id',
        'action',
        'comment',
        'actioned_at',
        'sla_deadline',
        'sla_paused',
        'sla_paused_at',
        'sla_resumed_at',
        'version',
    ];

    protected $casts = [
        'actioned_at' => 'datetime',
        'sla_deadline' => 'datetime',
        'sla_paused' => 'boolean',
        'sla_paused_at' => 'datetime',
        'sla_resumed_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($m) {
            $m->id ??= Str::uuid()->toString();
            $m->version ??= 1;
        });
    }

    public function requisition(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Requisition::class);
    }

    public function approver(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    /**
     * Concurrency-safe action using optimistic locking.
     * Returns true on success, false if another actor already actioned this step.
     *
     * @param string $action  One of: approved|rejected|returned|on_hold
     * @param string $comment Required for rejected|returned|on_hold
     * @param User   $actor
     */
    public function performAction(string $action, ?string $comment, User $actor): bool
    {
        // Guard: comment required for non-happy path actions
        if (in_array($action, ['rejected', 'returned', 'on_hold']) && empty(trim($comment ?? ''))) {
            throw new \InvalidArgumentException("Comment is required for action: {$action}");
        }

        // Optimistic lock: only update if still pending AND version matches
        $affected = DB::table('approval_steps')
            ->where('id', $this->id)
            ->where('action', 'pending')
            ->where('version', $this->version)
            ->update([
                'action' => $action,
                'comment' => $comment,
                'approver_id' => $actor->id,
                'actioned_at' => now(),
                'version' => $this->version + 1,
                'updated_at' => now(),
            ]);

        if ($affected === 0) {
            return false; // Conflict — another actor got here first
        }

        $this->refresh();
        return true;
    }

    public function isPending(): bool
    {
        return $this->action === 'pending';
    }

    public function isSlaBreached(): bool
    {
        return $this->sla_deadline && now()->isAfter($this->sla_deadline) && $this->isPending();
    }
}
