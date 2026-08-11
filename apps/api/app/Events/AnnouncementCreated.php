<?php

namespace App\Events;

use App\Models\Announcement;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AnnouncementCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $announcement;

    public function __construct(Announcement $announcement)
    {
        $this->announcement = $announcement->load('creator');
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('public-announcements'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'AnnouncementPosted';
    }
}
