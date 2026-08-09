<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Message extends Model
{
    protected $fillable = [
        'conversation_id', 'sender_id', 'type', 'body',
        'attachment_url', 'reply_to_id', 'edited_at', 'pinned_at'
    ];

    protected $casts = [
        'edited_at' => 'datetime',
        'pinned_at' => 'datetime',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'reply_to_id');
    }

    public function reads(): HasMany
    {
        return $this->hasMany(ConversationMessageRead::class);
    }

    public function reactions(): MorphMany
    {
        return $this->morphMany(Reaction::class, 'reactable');
    }
}
