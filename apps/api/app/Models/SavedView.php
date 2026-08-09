<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SavedView extends Model
{
    protected $fillable = ['user_id', 'entity', 'name', 'config'];

    protected $casts = [
        'config' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
