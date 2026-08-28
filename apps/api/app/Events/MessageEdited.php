<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageEdited implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;

    /**
     * Create a new event instance.
     */
    public function __construct($message)
    {
        $this->message = $message;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('conversation.' . $this->message->conversation_id),
        ];

        // Also broadcast to the user channel of all participants
        $conversation = \App\Models\Conversation::with('users')->find($this->message->conversation_id);
        if ($conversation && $conversation->scope !== 'global') {
            foreach ($conversation->users as $user) {
                $channels[] = new PrivateChannel('user.' . $user->id);
            }
        } elseif ($conversation && $conversation->scope === 'global') {
            $channels[] = new PrivateChannel('company.global');
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'message-edited';
    }

    public function broadcastWith(): array
    {
        return [
            'message' => $this->message,
        ];
    }
}
