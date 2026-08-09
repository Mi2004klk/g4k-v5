<?php

namespace App\Events;

use App\Models\ExportJob;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ExportCompleted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $exportJob;

    public function __construct(ExportJob $exportJob)
    {
        $this->exportJob = $exportJob;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->exportJob->user_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'export-completed';
    }
}
