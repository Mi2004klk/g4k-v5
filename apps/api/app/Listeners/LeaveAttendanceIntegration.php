<?php

namespace App\Listeners;

use App\Events\ApprovalDecided;
use App\Models\LeaveRequest;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class LeaveAttendanceIntegration implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(ApprovalDecided $event): void
    {
        $approval = $event->approval;

        if ($approval->decision === 'approved' && $approval->approvable_type === LeaveRequest::class) {
            $leaveRequest = LeaveRequest::find($approval->approvable_id);
            if (!$leaveRequest) return;

            $userId = $leaveRequest->user_id;
            $startDate = Carbon::parse($leaveRequest->start_date);
            $endDate = Carbon::parse($leaveRequest->end_date);

            // Fetch work schedule working_days
            $schedule = \Illuminate\Support\Facades\Cache::remember('default_work_schedule', 86400, function() {
                return \Illuminate\Support\Facades\DB::table('work_schedules')->where('is_default', true)->first();
            });
            $workingDays = [1, 2, 3, 4, 5, 6]; // Default Mon-Sat
            if ($schedule && !empty($schedule->working_days)) {
                $decoded = is_string($schedule->working_days) ? json_decode($schedule->working_days, true) : $schedule->working_days;
                if (is_array($decoded)) {
                    $workingDays = array_map('intval', $decoded);
                }
            }

            // Fetch holidays filtered by request span year(s) or recurring
            $startYear = $startDate->year;
            $endYear = $endDate->year;
            $holidays = DB::table('holidays')
                ->where(function ($q) use ($startYear, $endYear) {
                    $q->whereYear('date', '>=', $startYear)
                      ->whereYear('date', '<=', $endYear)
                      ->orWhere('recurring', true);
                })->get();

            DB::transaction(function () use ($startDate, $endDate, $workingDays, $holidays, $userId) {
                $currentDate = $startDate->copy();
                while ($currentDate->lte($endDate)) {
                    $dateStr = $currentDate->toDateString();
                    $dayIso = $currentDate->dayOfWeekIso; // 1 (Mon) to 7 (Sun)
                    $monthDay = $currentDate->format('m-d');

                // Check if working day using strict ISO 1-7 convention
                $isWorkingDay = in_array($dayIso, $workingDays);

                // Check if holiday (exact date or recurring m-d)
                $isHoliday = false;
                foreach ($holidays as $h) {
                    $hDateStr = Carbon::parse($h->date)->toDateString();
                    $hMonthDay = Carbon::parse($h->date)->format('m-d');
                    if ($dateStr === $hDateStr || (!empty($h->recurring) && $monthDay === $hMonthDay)) {
                        $isHoliday = true;
                        break;
                    }
                }

                if ($isWorkingDay && !$isHoliday) {
                    $existing = DB::table('attendance_days')
                        ->where('user_id', $userId)
                        ->where('date', $dateStr)
                        ->first();

                    if ($existing) {
                        if ($existing->status !== 'absent' && $existing->status !== 'leave') {
                            Log::warning("Leave approval overwriting active attendance day status for user {$userId} on {$dateStr}. Old status: {$existing->status}");
                        }

                        DB::table('attendance_days')
                            ->where('id', $existing->id)
                            ->update([
                                'status' => 'leave',
                                'source' => 'server',
                                'updated_at' => now(),
                                'version' => DB::raw('version + 1')
                            ]);
                    } else {
                        DB::table('attendance_days')->insert([
                            'user_id' => $userId,
                            'date' => $dateStr,
                            'status' => 'leave',
                            'source' => 'server',
                            'created_at' => now(),
                            'updated_at' => now(),
                            'version' => 1
                        ]);
                    }
                }

                $currentDate->addDay();
            }
            });
        }
    }
}
