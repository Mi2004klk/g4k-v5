<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProjectMemberUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $projectId;

    public function __construct($projectId)
    {
        $this->projectId = $projectId;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('project.' . $this->projectId),
        ];
    }
    
    public function broadcastAs(): string
    {
        return 'member-updated';
    }
}
