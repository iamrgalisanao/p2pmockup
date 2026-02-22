<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class AuditLog extends Model
{
    // Immutable — no updated_at, no soft deletes
    const UPDATED_AT = null;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'entity_type',
        'entity_id',
        'action',
        'actor_id',
        'actor_role',
        'before_state',
        'after_state',
        'ip_address',
    ];

    protected $casts = [
        'before_state' => 'array',
        'after_state' => 'array',
        'created_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->id ??= Str::uuid()->toString());

        // Prevent updates and deletes — this table is append-only
        static::updating(fn() => throw new \LogicException('AuditLog records are immutable.'));
        static::deleting(fn() => throw new \LogicException('AuditLog records cannot be deleted.'));
    }

    public function actor(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    /**
     * Convenience factory — creates an audit log entry for any entity.
     */
    public static function record(
        Model $entity,
        string $action,
        ?array $before = null,
        ?array $after = null,
        ?string $ipAddress = null,
    ): self {
        $user = auth()->user();

        return static::create([
            'entity_type' => (new \ReflectionClass($entity))->getShortName(),
            'entity_id' => $entity->getKey(),
            'action' => $action,
            'actor_id' => $user?->id,
            'actor_role' => $user?->role,
            'before_state' => $before,
            'after_state' => $after,
            'ip_address' => $ipAddress ?? request()?->ip(),
        ]);
    }
}
