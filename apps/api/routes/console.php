<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

Schedule::job(new \App\Jobs\RemindShiftStart)->everyFiveMinutes();
Schedule::job(new \App\Jobs\AlertMissedClockIn)->everyFiveMinutes();
Schedule::job(new \App\Jobs\FlagOpenShifts)->everyFiveMinutes();

Schedule::command('reports:send-weekly-summary')->weeklyOn(0, '09:00');
Schedule::command('sanctum:prune-expired --hours=24')->daily();
Schedule::command('passwords:expire-flag')->daily();
Schedule::command('reminders:holidays')->daily();
