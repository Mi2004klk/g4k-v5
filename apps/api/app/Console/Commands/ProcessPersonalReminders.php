<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ProcessPersonalReminders extends Command
{
    protected $signature = 'reminders:personal';

    protected $description = 'Process due personal reminders';

    public function handle(\App\Services\NotificationService $notificationService)
    {
        $reminders = \App\Models\PersonalReminder::with('user')
            ->where('status', 'pending')
            ->where('remind_at', '<=', \Carbon\Carbon::now())
            ->get();

        foreach ($reminders as $reminder) {
            if ($reminder->user) {
                $notificationService->send(
                    $reminder->user_id,
                    'system',
                    $reminder->title,
                    $reminder->body ?? "You have a personal reminder.",
                    ['reminder_id' => $reminder->id],
                    $reminder->link,
                    'high'
                );
            }
            $reminder->update(['status' => 'sent']);
        }

        $this->info("Processed {$reminders->count()} personal reminders.");
    }
}
