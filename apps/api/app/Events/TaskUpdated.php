<?php

namespace App\Events;

use App\Models\Task;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $task;

    public function __construct(Task $task)
    {
        $this->task = $task;
    }

    public function broadcastOn(): array
    {
        $channels = [];
        if ($this->task->project_id) {
            $channels[] = new PrivateChannel('project.' . $this->task->project_id);
        }

        $this->task->loadMissing('assignees');
        
        $usersToNotify = $this->task->assignees->pluck('id')->toArray();
        if ($this->task->created_by) {
            $usersToNotify[] = $this->task->created_by;
        }

        foreach (array_unique($usersToNotify) as $userId) {
            $channels[] = new PrivateChannel('user.' . $userId);
        }

        return $channels;
    }
    
    public function broadcastAs(): string
    {
        return 'task-updated';
    }
}
