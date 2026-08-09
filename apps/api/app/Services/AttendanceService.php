<?php

namespace App\Services;

use App\Models\AttendanceDay;
use App\Models\AttendanceEvent;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;
use App\Models\WorkSchedule;

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

            // Validate punch state machine
            $lastEvent = AttendanceEvent::where('user_id', $userId)
                ->whereDate('timestamp', $date)
                ->orderBy('timestamp', 'desc')
                ->first();

            $lastType = $lastEvent->type ?? null;

            $valid = match ($type) {
                'clock_in' => $lastType === null || $lastType === 'clock_out',
                'break_start' => $lastType === 'clock_in' || $lastType === 'break_end',
                'break_end' => $lastType === 'break_start',
                'clock_out' => $lastType === 'clock_in' || $lastType === 'break_end',
                default => false,
            };

            if (!$valid) {
                throw ValidationException::withMessages([
                    'type' => ["Cannot record '{$type}' when current state is " . ($lastType ?? 'not clocked in') . "."]
                ]);
            }

            // Idempotency check via client_id
            $existing = AttendanceEvent::where('client_id', $clientId)->first();
            if (!$existing) {
                AttendanceEvent::create([
                    'client_id' => $clientId,
                    'user_id' => $userId,
                    'type' => $type,
                    'timestamp' => $parsedTs,
                    'device_meta' => $deviceMeta,
                    'source' => 'server',
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
        $startWindow = Carbon::parse($date)->startOfDay();
        $endWindow = Carbon::parse($date)->addHours(36);

        $allEvents = AttendanceEvent::where('user_id', $userId)
            ->whereBetween('timestamp', [$startWindow, $endWindow])
            ->orderBy('timestamp', 'asc')
            ->get();

        $events = [];
        $hasStartedOnDate = false;

        foreach ($allEvents as $ev) {
            $evDate = $ev->timestamp->toDateString();
            if ($ev->type === 'clock_in' && $evDate === $date) {
                $hasStartedOnDate = true;
            }
            if ($hasStartedOnDate) {
                $events[] = $ev;
                if ($ev->type === 'clock_out') {
                    break;
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
            $ts = $event->timestamp;
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

        // Removed the active now()->diffInSeconds calculation to prevent drift.
        // total_seconds now accurately reflects closed time segments only.

        $hasOpenShift = false;
        $lastEventType = $lastEvent ? $events[count($events) - 1]->type : null;
        if ($lastEventType === 'clock_in' || $lastEventType === 'break_end') {
            $hasOpenShift = true;
        }

        // Get existing to check for manual overrides
        $existingDay = AttendanceDay::where('user_id', $userId)->where('date', $date)->first();
        
        if ($existingDay && $existingDay->source === 'manual') {
            // Do not override manually corrected total_seconds or break_seconds.
            // Just update structural things if needed, or skip.
            // For safety, we will just update has_open_shift and last_event.
            $existingDay->update([
                'first_event' => $firstEvent ?? $existingDay->first_event,
                'last_event' => $lastEvent ?? $existingDay->last_event,
                'clock_out' => $lastClockOut ?? $existingDay->clock_out,
                'has_open_shift' => $hasOpenShift,
                'updated_at' => now(),
            ]);
            return $existingDay->toArray();
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

        $dayRecord = AttendanceDay::updateOrCreate(
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
                'has_open_shift' => $hasOpenShift,
                'status' => $status,
                'source' => 'server',
                'version' => DB::raw('version + 1'),
                'updated_at' => now(),
            ]
        );

        // Fetch fresh to get evaluated raw expressions
        return $dayRecord->fresh()->toArray();
    }
}

