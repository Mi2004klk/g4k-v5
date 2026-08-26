<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ActiveTaskUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $userId;
    public $taskId;
    public $projectId;

    /**
     * Create a new event instance.
     */
    public function __construct($userId, $taskId = null, $projectId = null)
    {
        $this->userId = $userId;
        $this->taskId = $taskId;
        $this->projectId = $projectId;
    }

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('company.global'),
        ];
        
        $user = \App\Models\User::find($this->userId);
        if ($user && $user->department_id) {
            $channels[] = new PrivateChannel('department.' . $user->department_id);
            $channels[] = new PrivateChannel('attendance.' . $user->department_id);
        }
        
        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'active-task-updated';
    }
}
