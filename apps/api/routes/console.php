<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

Schedule::job(new \App\Jobs\RemindShiftStart)->dailyAt('08:50');
Schedule::job(new \App\Jobs\AlertMissedClockIn)->dailyAt('09:30');
Schedule::job(new \App\Jobs\FlagOpenShifts)->dailyAt('23:55');

Schedule::command('reports:send-weekly-summary')->weeklyOn(0, '09:00');
