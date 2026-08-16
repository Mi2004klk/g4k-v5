<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Announcement extends Model
{
    use \App\Traits\HasDemoTag;
    protected $fillable = ['title', 'body', 'scope', 'team_id', 'created_by', 'pinned_at', 'reactions', 'priority', 'demo_tag', 'is_demo'];

    protected $casts = [
        'pinned_at' => 'datetime',
    ];

    protected $appends = ['reactions'];

    public function getReactionsAttribute($value)
    {
        if ($this->relationLoaded('reactionsList')) {
            $reactionsJson = [];
            foreach ($this->reactionsList as $reaction) {
                if (!isset($reactionsJson[$reaction->emoji])) {
                    $reactionsJson[$reaction->emoji] = [];
                }
                $reactionsJson[$reaction->emoji][] = $reaction->user_id;
            }
            return $reactionsJson;
        }

        return is_string($value) ? json_decode($value, true) : ($value ?? []);
    }

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
