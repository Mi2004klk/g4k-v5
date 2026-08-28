<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ScheduledReport;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class RunScheduledReports extends Command
{
    protected $signature = 'reports:run';
    protected $description = 'Run scheduled reports based on their frequency and time';

    public function handle()
    {
        $now = Carbon::now();
        $this->info("Checking for scheduled reports to run at {$now->toDateTimeString()}");

        // We only consider active reports where next_run_at is null or in the past
        $reports = ScheduledReport::where('is_active', true)
            ->where(function($query) use ($now) {
                $query->whereNull('next_run_at')
                      ->orWhere('next_run_at', '<=', $now);
            })
            ->get();

        if ($reports->isEmpty()) {
            $this->info("No reports to run at this time.");
            return;
        }

        foreach ($reports as $report) {
            try {
                $this->runReport($report);
                $this->updateNextRunAt($report, $now);
                $this->info("Successfully ran report: {$report->name}");
            } catch (\Exception $e) {
                Log::error("Failed to run scheduled report {$report->id}: " . $e->getMessage());
                $this->error("Failed to run report {$report->name}. Check logs for details.");
            }
        }
    }

    protected function runReport(ScheduledReport $report)
    {
        // In a real application, we would generate a CSV/PDF and email it to $report->recipients
        // For now, we simulate the report generation and sending
        Log::info("Generating report '{$report->name}' of type '{$report->type}' and sending to " . implode(', ', $report->recipients));
        
        $report->update(['last_run_at' => Carbon::now()]);
    }

    protected function updateNextRunAt(ScheduledReport $report, Carbon $now)
    {
        $next = $now->copy();

        if ($report->frequency === 'daily') {
            $timeParts = explode(':', $report->time);
            $next->setTime($timeParts[0], $timeParts[1] ?? 0);
            
            // If the time has already passed today, schedule for tomorrow
            if ($next->isPast()) {
                $next->addDay();
            }
        } elseif ($report->frequency === 'weekly') {
            $timeParts = explode(':', $report->time);
            $next->setTime($timeParts[0], $timeParts[1] ?? 0);
            
            $targetDay = $report->day_of_week ?? 1; // 0 (Sun) to 6 (Sat)
            
            if ($next->dayOfWeek > $targetDay || ($next->dayOfWeek == $targetDay && $next->isPast())) {
                $next->next($targetDay);
            } else {
                $next->next($targetDay);
                if ($next->isPast()) {
                    $next->addWeek();
                }
                // Actually `next($targetDay)` moves to the next occurrence.
                // We could just do:
                $next = $now->copy()->setTime($timeParts[0], $timeParts[1] ?? 0);
                while ($next->dayOfWeek != $targetDay || $next->isPast()) {
                    $next->addDay();
                }
            }
        } elseif ($report->frequency === 'monthly') {
            $timeParts = explode(':', $report->time);
            $next->setTime($timeParts[0], $timeParts[1] ?? 0);
            
            $targetDate = $report->day_of_month ?? 1;
            
            // Handle months with fewer days
            $daysInMonth = $next->daysInMonth;
            $actualDate = min($targetDate, $daysInMonth);
            
            $next->day($actualDate);
            
            if ($next->isPast()) {
                $next->addMonth();
                $daysInNextMonth = $next->daysInMonth;
                $next->day(min($targetDate, $daysInNextMonth));
            }
        }

        $report->update(['next_run_at' => $next]);
    }
}
