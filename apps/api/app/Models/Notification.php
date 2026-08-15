<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use \App\Traits\HasDemoTag;
    protected $fillable = ['user_id', 'type', 'priority', 'title', 'body', 'data', 'read_at', 'link', 'demo_tag'];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
