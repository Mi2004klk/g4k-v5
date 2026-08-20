<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

Schedule::job(new \App\Jobs\RemindShiftStart)->everyFiveMinutes()->withoutOverlapping();
Schedule::job(new \App\Jobs\AlertMissedClockIn)->everyFiveMinutes()->withoutOverlapping();
Schedule::job(new \App\Jobs\FlagOpenShifts)->everyFiveMinutes()->withoutOverlapping();

Schedule::command('reports:send-weekly-summary')->weeklyOn(0, '09:00')->withoutOverlapping()->onOneServer();
Schedule::command('sanctum:prune-expired --hours=24')->daily()->withoutOverlapping()->onOneServer();
Schedule::command('passwords:expire-flag')->daily()->withoutOverlapping()->onOneServer();
Schedule::command('reminders:holidays')->daily()->withoutOverlapping()->onOneServer();
Schedule::command('notifications:cleanup')->daily()->withoutOverlapping()->onOneServer();
Schedule::command('tasks:reminders')->everyMinute()->withoutOverlapping()->onOneServer();
Schedule::command('reports:cleanup-exports')->daily()->withoutOverlapping()->onOneServer();
