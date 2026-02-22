<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Attachment extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'entity_type',
        'entity_id',
        'doc_type',
        'original_filename',
        'storage_key',
        'mime_type',
        'size_bytes',
        'uploaded_by',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->id ??= Str::uuid()->toString());
    }

    public function uploadedBy(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * Generate a time-limited presigned URL for this attachment.
     */
    public function presignedUrl(int $seconds = 3600): string
    {
        return \Illuminate\Support\Facades\Storage::disk('s3')
            ->temporaryUrl($this->storage_key, now()->addSeconds($seconds));
    }
}
