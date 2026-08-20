<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

$tz = \App\Models\CompanyProfile::first()?->timezone ?? config('app.timezone');

Schedule::job(new \App\Jobs\RemindShiftStart)->everyFiveMinutes()->withoutOverlapping()->timezone($tz);
Schedule::job(new \App\Jobs\AlertMissedClockIn)->everyFiveMinutes()->withoutOverlapping()->timezone($tz);
Schedule::job(new \App\Jobs\FlagOpenShifts)->everyFiveMinutes()->withoutOverlapping()->timezone($tz);

Schedule::command('reports:send-weekly-summary')->weeklyOn(0, '09:00')->withoutOverlapping()->onOneServer()->timezone($tz);
Schedule::command('sanctum:prune-expired --hours=24')->daily()->withoutOverlapping()->onOneServer()->timezone($tz);
Schedule::command('passwords:expire-flag')->daily()->withoutOverlapping()->onOneServer()->timezone($tz);
Schedule::command('reminders:holidays')->daily()->withoutOverlapping()->onOneServer()->timezone($tz);
Schedule::command('notifications:cleanup')->daily()->withoutOverlapping()->onOneServer()->timezone($tz);
Schedule::command('tasks:reminders')->everyMinute()->withoutOverlapping()->onOneServer()->timezone($tz);
Schedule::command('reports:cleanup-exports')->daily()->withoutOverlapping()->onOneServer()->timezone($tz);
