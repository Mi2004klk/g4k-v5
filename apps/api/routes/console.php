<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

Schedule::job(new \App\Jobs\RemindShiftStart)->everyFiveMinutes()->withoutOverlapping()->timezone('Asia/Kolkata');
Schedule::job(new \App\Jobs\AlertMissedClockIn)->everyFiveMinutes()->withoutOverlapping()->timezone('Asia/Kolkata');
Schedule::job(new \App\Jobs\FlagOpenShifts)->everyFiveMinutes()->withoutOverlapping()->timezone('Asia/Kolkata');

Schedule::command('reports:send-weekly-summary')->weeklyOn(0, '09:00')->withoutOverlapping()->onOneServer()->timezone('Asia/Kolkata');
Schedule::command('sanctum:prune-expired --hours=24')->daily()->withoutOverlapping()->onOneServer()->timezone('Asia/Kolkata');
Schedule::command('passwords:expire-flag')->daily()->withoutOverlapping()->onOneServer()->timezone('Asia/Kolkata');
Schedule::command('reminders:holidays')->daily()->withoutOverlapping()->onOneServer()->timezone('Asia/Kolkata');
Schedule::command('notifications:cleanup')->daily()->withoutOverlapping()->onOneServer()->timezone('Asia/Kolkata');
Schedule::command('tasks:reminders')->everyMinute()->withoutOverlapping()->onOneServer()->timezone('Asia/Kolkata');

Schedule::call(function () {
    \Illuminate\Support\Facades\Log::info('Scheduler heartbeat - alive');
})->everyMinute();
