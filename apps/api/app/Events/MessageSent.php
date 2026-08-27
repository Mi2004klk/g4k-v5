<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;

    public function __construct(Message $message)
    {
        $this->message = $message->load(['sender', 'replyTo']);
    }

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('conversation.' . $this->message->conversation_id),
        ];

        // Also broadcast to the user channel of all participants
        $conversation = \App\Models\Conversation::with('users')->find($this->message->conversation_id);
        if ($conversation && $conversation->scope !== 'global') {
            foreach ($conversation->users as $user) {
                if ($user->id !== $this->message->sender_id) {
                    $channels[] = new PrivateChannel('user.' . $user->id);
                }
            }
        } elseif ($conversation && $conversation->scope === 'global') {
            $channels[] = new PrivateChannel('company.global');
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'message-sent';
    }
}
