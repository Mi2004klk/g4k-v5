<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AttendanceUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $userId;
    public $action;

    /**
     * Create a new event instance.
     */
    public function __construct($userId = null, $action = 'updated')
    {
        $this->userId = $userId;
        $this->action = $action;
    }

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('company.global'),
        ];
        
        if ($this->userId) {
            $user = \App\Models\User::find($this->userId);
            if ($user && $user->department_id) {
                $channels[] = new PrivateChannel('department.' . $user->department_id);
                $channels[] = new PrivateChannel('attendance.' . $user->department_id);
            }
        }
        
        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'attendance-updated';
    }

    /**
     * Get the data to broadcast.
     * Restrict payload to prevent metadata leakage on the global channel.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'timestamp' => now()->timestamp
        ];
    }
}
