<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Task;
use App\Models\Project;
use App\Mail\WeeklySummaryMail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendWeeklySummaryCommand extends Command
{
    protected $signature = 'reports:send-weekly-summary';
    protected $description = 'Send weekly summary email to Admins and HR users every Sunday at 09:00 AM';

    public function handle(): void
    {
        $recipients = User::whereHas('roleAssignments', function ($q) {
            $q->whereIn('role', ['hr', 'super_admin']);
        })->get();

        $metrics = [
            'tasks_completed' => Task::where('status', 'completed')->count(),
            'active_projects' => Project::where('status', 'in_progress')->count(),
        ];

        foreach ($recipients as $user) {
            Mail::to($user->email)->send(new WeeklySummaryMail($user, $metrics));
        }

        $this->info("Weekly summary sent to " . count($recipients) . " recipients.");
    }
}
