<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Announcement extends Model
{
    protected $fillable = ['title', 'body', 'scope', 'team_id', 'created_by', 'pinned_at', 'reactions'];

    protected $casts = [
        'pinned_at' => 'datetime',
        'reactions' => 'array',
    ];

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reactionsList(): MorphMany
    {
        return $this->morphMany(Reaction::class, 'reactable');
    }
}
