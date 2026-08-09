<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Event;
use App\Events\ApprovalDecided;
use App\Listeners\LeaveAttendanceIntegration;
use App\Models\Notification;
use App\Observers\NotificationObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Event::listen(\App\Events\ApprovalSubmitted::class, \App\Listeners\NotifyApprovalSubmitted::class);
        Event::listen(ApprovalDecided::class, LeaveAttendanceIntegration::class);
        Notification::observe(NotificationObserver::class);
    }
}
