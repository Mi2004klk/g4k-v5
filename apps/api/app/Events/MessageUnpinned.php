<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageUnpinned implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $conversationId;
    public $messageId;

    /**
     * Create a new event instance.
     */
    public function __construct($conversationId, $messageId)
    {
        $this->conversationId = $conversationId;
        $this->messageId = $messageId;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('conversation.' . $this->conversationId),
        ];

        // Also broadcast to the user channel of all participants
        $conversation = \App\Models\Conversation::with('users')->find($this->conversationId);
        if ($conversation && $conversation->scope !== 'global') {
            foreach ($conversation->users as $user) {
                $channels[] = new PrivateChannel('user.' . $user->id);
            }
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'message-unpinned';
    }

    public function broadcastWith(): array
    {
        return [
            'conversation_id' => $this->conversationId,
            'message_id' => $this->messageId,
        ];
    }
}
