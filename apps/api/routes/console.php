<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

Schedule::command('attendance:remind-start')->everyFifteenMinutes();
Schedule::command('attendance:alert-missed')->everyThirtyMinutes();
Schedule::command('attendance:flag-open-shifts')->hourly();

Schedule::command('reports:send-weekly-summary')->weeklyOn(0, '09:00');
