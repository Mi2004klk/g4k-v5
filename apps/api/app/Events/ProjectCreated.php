<?php

namespace App\Events;

use App\Models\Project;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProjectCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $project;

    public function __construct(Project $project)
    {
        $this->project = $project;
    }

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('company.global'),
            new PrivateChannel('department.' . $this->project->department_id)
        ];

        return $channels;
    }
    
    public function broadcastAs(): string
    {
        return 'project-created';
    }
}
