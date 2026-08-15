<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuickNote extends Model
{
    use \App\Traits\HasDemoTag;
    protected $fillable = ['user_id', 'body', 'pinned', 'demo_tag'];

    protected $casts = [
        'pinned' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
