<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Artisan;
use App\Models\User;

class SeedDemoDataJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 600; // 10 minutes, as it may take a while
    public $tries = 1;

    protected $initiatorId;

    public function __construct($initiatorId)
    {
        $this->initiatorId = $initiatorId;
    }

    public function handle()
    {
        // Execute the seed command
        Artisan::call('demo:seed', ['--fresh' => true]);

        // Send completion notification
        if ($this->initiatorId) {
            $user = User::find($this->initiatorId);
            if ($user) {
                \App\Services\NotificationService::sendGlobalNotification(
                    $user,
                    "Demo dataset has been successfully seeded. The dashboard is now populated.",
                    "/dashboard/settings",
                    "high"
                );
            }
        }
    }
}
