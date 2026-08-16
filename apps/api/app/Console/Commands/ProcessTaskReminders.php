<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\TaskReminder;
use App\Services\NotificationService;
use Carbon\Carbon;

class ProcessTaskReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tasks:reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process due task reminders';

    /**
     * Execute the console command.
     */
    public function handle(NotificationService $notificationService)
    {
        $reminders = TaskReminder::with(['task', 'user'])
            ->where('status', 'pending')
            ->where('remind_at', '<=', Carbon::now())
            ->get();

        foreach ($reminders as $reminder) {
            if ($reminder->task && $reminder->user) {
                $notificationService->send(
                    $reminder->user_id,
                    'task_reminder',
                    "Reminder: Task '{$reminder->task->title}' is due soon or requires attention.",
                    $reminder->task->project_id ? "/dashboard/projects/{$reminder->task->project_id}" : "/dashboard",
                    "task-{$reminder->task_id}",
                    'normal'
                );
            }
            
            $reminder->update(['status' => 'sent']);
        }

        $this->info("Processed {$reminders->count()} task reminders.");
    }
}
