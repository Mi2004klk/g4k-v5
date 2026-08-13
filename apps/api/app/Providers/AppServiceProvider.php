<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Event;
use App\Events\ApprovalDecided;
use App\Listeners\LeaveAttendanceIntegration;
use App\Models\Notification;
use App\Observers\NotificationObserver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

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
        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('settings')) {
                \App\Support\SmtpSettings::apply();
            }
        } catch (\Exception $e) {
            // Ignore during migrations
        }

        $listeners = [
            [\App\Events\ApprovalSubmitted::class, \App\Listeners\NotifyApprovalSubmitted::class],
            [ApprovalDecided::class, LeaveAttendanceIntegration::class],
            [ApprovalDecided::class, \App\Listeners\ProcessApprovalDecision::class],
            [\App\Events\TaskCompleted::class, \App\Listeners\PostTaskCompletionToGlobalChat::class],
        ];

        foreach ($listeners as [$event, $listener]) {
            try {
                Event::listen($event, $listener);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Failed to register listener $listener for $event: " . $e->getMessage());
            }
        }

        $observers = [
            \App\Models\Notification::class => NotificationObserver::class,
            \App\Models\Project::class => \App\Observers\CacheInvalidationObserver::class,
            \App\Models\Task::class => \App\Observers\CacheInvalidationObserver::class,
            \App\Models\AttendanceDay::class => \App\Observers\CacheInvalidationObserver::class,
            \App\Models\LeaveRequest::class => \App\Observers\CacheInvalidationObserver::class,
        ];

        foreach ($observers as $model => $observer) {
            try {
                $model::observe($observer);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Failed to register observer $observer for $model: " . $e->getMessage());
            }
        }

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });
    }
}
