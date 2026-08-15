<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Artisan;
use App\Models\User;

class PurgeDemoDataJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 300; // 5 minutes
    public $tries = 1;

    protected $initiatorId;

    public function __construct($initiatorId)
    {
        $this->initiatorId = $initiatorId;
    }

    public function handle()
    {
        // Execute the purge command
        Artisan::call('demo:purge');

        // Send completion notification
        if ($this->initiatorId) {
            $user = User::find($this->initiatorId);
            if ($user) {
                \App\Services\NotificationService::sendGlobalNotification(
                    $user,
                    "Demo dataset has been successfully removed.",
                    "/dashboard/settings",
                    "high"
                );
            }
        }
    }
}
