<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    public $timestamps = false; // Uses custom 'at' timestamp

    protected $fillable = [
        'user_id',
        'action',
        'subject_type',
        'subject_id',
        'before',
        'after',
        'ip',
        'meta',
        'at',
    ];

    protected $casts = [
        'before' => 'array',
        'after' => 'array',
        'meta' => 'array',
        'at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
