<?php

namespace App\Events;

use App\Models\Notification;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Notification $notification;

    public function __construct(Notification $notification)
    {
        $this->notification = $notification;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->notification->user_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'notification-created';
    }

    public function broadcastWith(): array
    {
        return $this->notification->toArray();
    }

    public function broadcastWhen(): bool
    {
        $user = \App\Models\User::find($this->notification->user_id);
        
        if (!$user) {
            return false;
        }

        $prefs = $user->preferences ?? [];
        $soundEnabled = $prefs['notifications']['sound'] ?? true;
        
        if (!$soundEnabled) {
            return false;
        }

        // Ideally we would also check presence channel online status here to prevent duplicate Firebase/Pusher
        // if they are actively using the app.

        return true;
    }
}
