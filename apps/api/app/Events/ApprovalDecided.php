<?php

namespace App\Events;

use App\Models\Approval;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ApprovalDecided implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Approval $approval;

    public function __construct(Approval $approval)
    {
        $this->approval = $approval;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->approval->submitted_by),
        ];
    }

    public function broadcastAs(): string
    {
        return 'approval-status-change';
    }

    public function broadcastWith(): array
    {
        return [
            'approval_id' => $this->approval->id,
            'approvable_type' => $this->approval->approvable_type,
            'approvable_id' => $this->approval->approvable_id,
            'status' => $this->approval->status,
        ];
    }
}
