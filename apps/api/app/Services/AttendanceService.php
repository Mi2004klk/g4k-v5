<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AttendanceService
{
    /**
     * Record an immutable attendance event and trigger day reconciliation.
     */
    public static function recordEvent(int $userId, string $type, string $timestamp, string $clientId, ?array $deviceMeta = null): array
    {
        return DB::transaction(function () use ($userId, $type, $timestamp, $clientId, $deviceMeta) {
            $parsedTs = Carbon::parse($timestamp);
            $date = $parsedTs->toDateString();

            // Idempotency check via client_id
            $existing = DB::table('attendance_events')->where('client_id', $clientId)->first();
            if (!$existing) {
                DB::table('attendance_events')->insert([
                    'client_id' => $clientId,
                    'user_id' => $userId,
                    'type' => $type,
                    'timestamp' => $parsedTs,
                    'device_meta' => $deviceMeta ? json_encode($deviceMeta) : null,
                    'source' => 'server',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return static::reconcileDay($userId, $date);
        });
    }

    /**
     * Reconcile day summary from immutable events log.
     */
    public static function reconcileDay(int $userId, string $date): array
    {
        // ATT-Q2: Cross-midnight shifts are attributed entirely to the clock-in date.
        // Fetch events starting from $date 00:00:00 up to 36 hours later, belonging to this shift.
        $startWindow = Carbon::parse($date)->startOfDay();
        $endWindow = Carbon::parse($date)->addHours(36);

        $allEvents = DB::table('attendance_events')
            ->where('user_id', $userId)
            ->whereBetween('timestamp', [$startWindow, $endWindow])
            ->orderBy('timestamp', 'asc')
            ->get();

        // Filter events that belong to the shift starting on $date
        $events = [];
        $hasStartedOnDate = false;

        foreach ($allEvents as $ev) {
            $evDate = Carbon::parse($ev->timestamp)->toDateString();
            if ($ev->type === 'clock_in' && $evDate === $date) {
                $hasStartedOnDate = true;
            }
            if ($hasStartedOnDate) {
                $events[] = $ev;
                if ($ev->type === 'clock_out') {
                    break; // Shift completed
                }
            }
        }

        $schedule = DB::table('work_schedules')->where('is_default', true)->first();
        $startTimeStr = $schedule->start_time ?? '09:00:00';
        $standardSeconds = $schedule->standard_seconds ?? 31500;

        $firstClockIn = null;
        $lastClockOut = null;
        $firstEvent = null;
        $lastEvent = null;

        $totalSeconds = 0;
        $breakSeconds = 0;

        $currentWorkStart = null;
        $currentBreakStart = null;

        foreach ($events as $event) {
            $ts = Carbon::parse($event->timestamp);
            if (!$firstEvent) $firstEvent = $ts;
            $lastEvent = $ts;

            switch ($event->type) {
                case 'clock_in':
                    if (!$firstClockIn) $firstClockIn = $ts;
                    if (!$currentWorkStart) $currentWorkStart = $ts;
                    break;

                case 'break_start':
                    if ($currentWorkStart) {
                        $totalSeconds += $ts->diffInSeconds($currentWorkStart);
                        $currentWorkStart = null;
                    }
                    $currentBreakStart = $ts;
                    break;

                case 'break_end':
                    if ($currentBreakStart) {
                        $breakSeconds += $ts->diffInSeconds($currentBreakStart);
                        $currentBreakStart = null;
                    }
                    $currentWorkStart = $ts;
                    break;

                case 'clock_out':
                    $lastClockOut = $ts;
                    if ($currentWorkStart) {
                        $totalSeconds += $ts->diffInSeconds($currentWorkStart);
                        $currentWorkStart = null;
                    }
                    if ($currentBreakStart) {
                        $breakSeconds += $ts->diffInSeconds($currentBreakStart);
                        $currentBreakStart = null;
                    }
                    break;
            }
        }

        // If still active (on clock), compute up to now
        if ($currentWorkStart) {
            $totalSeconds += Carbon::now()->diffInSeconds($currentWorkStart);
        }

        $overtimeSeconds = max(0, $totalSeconds - $standardSeconds);
        $lateMinutes = 0;
        if ($firstClockIn) {
            $scheduledStart = Carbon::parse($date . ' ' . $startTimeStr);
            if ($firstClockIn->gt($scheduledStart)) {
                $lateMinutes = $firstClockIn->diffInMinutes($scheduledStart);
            }
        }

        $status = 'absent';
        if ($totalSeconds > 0) {
            $status = ($lateMinutes > 0) ? 'late' : 'present';
        }

        DB::table('attendance_days')->updateOrInsert(
            ['user_id' => $userId, 'date' => $date],
            [
                'clock_in' => $firstClockIn,
                'clock_out' => $lastClockOut,
                'first_event' => $firstEvent,
                'last_event' => $lastEvent,
                'total_seconds' => $totalSeconds,
                'break_seconds' => $breakSeconds,
                'overtime_seconds' => $overtimeSeconds,
                'late_minutes' => $lateMinutes,
                'status' => $status,
                'source' => 'server',
                'version' => DB::raw('version + 1'),
                'updated_at' => now(),
            ]
        );

        $dayRecord = DB::table('attendance_days')->where('user_id', $userId)->where('date', $date)->first();
        return (array) $dayRecord;
    }
}
