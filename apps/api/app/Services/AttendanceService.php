<?php

namespace App\Services;

use App\Models\AttendanceDay;
use App\Models\AttendanceEvent;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;
use App\Models\WorkSchedule;
use App\Models\User;

class AttendanceService
{
    /**
     * Record an immutable attendance event and trigger day reconciliation.
     */
    public static function recordEvent(int $userId, string $type, string $timestamp, string $clientId, ?array $deviceMeta = null): array
    {
        return DB::transaction(function () use ($userId, $type, $timestamp, $clientId, $deviceMeta) {
            // Lock the user row to prevent race conditions during concurrent punches
            \App\Models\User::where('id', $userId)->lockForUpdate()->first();

            $parsedTs = Carbon::parse($timestamp);
            $date = $parsedTs->toDateString();

            // Check events within the last 48 hours to support overnight shifts
            $lastEvent = AttendanceEvent::where('user_id', $userId)
                ->where('timestamp', '>=', Carbon::parse($date)->subHours(48))
                ->where('timestamp', '<=', $parsedTs)
                ->orderBy('timestamp', 'desc')
                ->first();

            $lastType = $lastEvent->type ?? null;

            if ($type === 'clock_in' && in_array($lastType, ['clock_in', 'break_start', 'break_end'])) {
                return static::reconcileDay($userId, $date); // already on shift — no-op, return current day
            }

            $valid = match ($type) {
                'clock_in' => $lastType === null || $lastType === 'clock_out',
                'break_start' => $lastType === 'clock_in' || $lastType === 'break_end',
                'break_end' => $lastType === 'break_start',
                'clock_out' => in_array($lastType, ['clock_in', 'break_end', 'break_start']),
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

            $reconcileDate = $date;
            if (in_array($type, ['clock_out', 'break_start', 'break_end'])) {
                $shiftStartEvent = AttendanceEvent::where('user_id', $userId)
                    ->where('timestamp', '<=', $parsedTs)
                    ->where('type', 'clock_in')
                    ->orderBy('timestamp', 'desc')
                    ->first();
                if ($shiftStartEvent) {
                    $reconcileDate = $shiftStartEvent->timestamp->toDateString();
                }
            }

            return static::reconcileDay($userId, $reconcileDate);
        });
    }

    /**
     * Reconcile day summary from immutable events log.
     */
    public static function reconcileDay(int $userId, string $date, bool $forceRecompute = false, ?User $cachedUser = null, $cachedSchedule = null): array
    {
        try {
            $tz = \App\Models\CompanyProfile::first()?->timezone ?? config('app.timezone', 'Asia/Kolkata');
            
            $startWindow = Carbon::parse($date, $tz)->startOfDay();
            $endWindow = Carbon::parse($date, $tz)->addHours(48);

            $allEvents = AttendanceEvent::where('user_id', $userId)
                ->whereBetween('timestamp', [$startWindow, $endWindow])
                ->orderBy('timestamp', 'asc')
                ->get();

            $events = [];
            $hasStartedOnDate = false;

            foreach ($allEvents as $ev) {
                $evDate = $ev->timestamp->toDateString();
                
                if ($ev->type === 'clock_in') {
                    if ($evDate === $date) {
                        $hasStartedOnDate = true;
                    } elseif ($evDate !== $date && $hasStartedOnDate) {
                        break;
                    }
                }
                
                if ($hasStartedOnDate) {
                    $events[] = $ev;
                }
            }

            $user = $cachedUser ?? User::find($userId);
            $schedule = $cachedSchedule;
            if (!$schedule) {
                if ($user && $user->work_schedule_id) {
                    $schedule = \App\Models\WorkSchedule::find($user->work_schedule_id);
                }
                if (!$schedule) {
                    $schedule = \App\Models\WorkSchedule::where('is_default', true)->first();
                }
            }
            $startTimeStr = '09:00:00';
            $standardSeconds = 31500;
            $graceMinutes = 10;

            if (is_object($schedule)) {
                $startTimeStr = $schedule->start_time ?? '09:00:00';
                $standardSeconds = (int)($schedule->standard_seconds ?? 31500);
                $graceMinutes = (int)($schedule->grace_minutes ?? 10);
            } elseif (is_array($schedule)) {
                $startTimeStr = $schedule['start_time'] ?? '09:00:00';
                $standardSeconds = (int)($schedule['standard_seconds'] ?? 31500);
                $graceMinutes = (int)($schedule['grace_minutes'] ?? 10);
            }

            $firstClockIn = null;
            $lastClockOut = null;
            $firstEvent = null;
            $lastEvent = null;

            $totalSeconds = 0;
            $breakSeconds = 0;
            $unapprovedBreakSeconds = 0;

            $currentWorkStart = null;
            $currentBreakStart = null;
            $currentBreakIsApproved = false;

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
                            $totalSeconds += abs($ts->diffInSeconds($currentWorkStart));
                            $currentWorkStart = null;
                        }
                        $currentBreakStart = $ts;
                        $currentBreakIsApproved = $event->is_approved ?? false;
                        break;

                    case 'break_end':
                        if ($currentBreakStart) {
                            $duration = abs($ts->diffInSeconds($currentBreakStart));
                            $breakSeconds += $duration;
                            if (!$currentBreakIsApproved) {
                                $unapprovedBreakSeconds += $duration;
                            }
                            $currentBreakStart = null;
                        }
                        $currentWorkStart = $ts;
                        break;

                    case 'clock_out':
                        $lastClockOut = $ts;
                        if ($currentWorkStart) {
                            $totalSeconds += abs($ts->diffInSeconds($currentWorkStart));
                            $currentWorkStart = null;
                        }
                        if ($currentBreakStart) {
                            $duration = abs($ts->diffInSeconds($currentBreakStart));
                            $breakSeconds += $duration;
                            if (!$currentBreakIsApproved) {
                                $unapprovedBreakSeconds += $duration;
                            }
                            $currentBreakStart = null;
                        }
                        break;
                }
            }

            $hasOpenShift = false;
            $lastEventType = $lastEvent ? $events[count($events) - 1]->type : null;
            if ($lastEventType === 'clock_in' || $lastEventType === 'break_end') {
                $hasOpenShift = true;
            }

            $existingDay = AttendanceDay::where('user_id', $userId)->where('date', $date)->first();
            
            if (!$forceRecompute && $existingDay && $existingDay->source === 'manual') {
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
            
            $grace = $graceMinutes;
            $graceSeconds = $grace * 60;

            if ($firstClockIn) {
                $scheduledStart = Carbon::parse($date . ' ' . $startTimeStr, $tz);
                if ($firstClockIn->timestamp > $scheduledStart->timestamp + $graceSeconds) {
                    $lateSeconds = $firstClockIn->timestamp - $scheduledStart->timestamp;
                    $lateMinutes = (int) floor($lateSeconds / 60);
                }
            }

            $monthDay = Carbon::parse($date)->format('m-d');
            $allHolidays = \Illuminate\Support\Facades\Cache::remember('all_holidays_array', 86400, function () {
                return DB::table('holidays')->get()->toArray();
            });
            $isHoliday = collect($allHolidays)->contains(function ($h) use ($date, $monthDay) {
                if (!empty($h->date) && str_starts_with((string)$h->date, $date)) return true;
                if (!empty($h->recurring) && !empty($h->date)) {
                    $hMonthDay = Carbon::parse($h->date)->format('m-d');
                    if ($hMonthDay === $monthDay) return true;
                    if ($monthDay === '02-28' && $hMonthDay === '02-29') return true;
                }
                return false;
            });

            $status = 'absent';
            if ($firstClockIn !== null) {
                $status = ($lateMinutes > 0) ? 'late' : 'present';
            } elseif ($isHoliday) {
                $status = 'holiday';
                $lateMinutes = 0;
            }

            $existingSource = $existingDay ? $existingDay->source : 'server';
            $source = ($existingSource === 'manual' || $forceRecompute && $existingSource === 'manual') ? 'manual' : 'server';
            $version = $existingDay ? $existingDay->version + 1 : 1;

            $dayRecord = AttendanceDay::updateOrCreate(
                ['user_id' => $userId, 'date' => $date],
                [
                    'clock_in' => $firstClockIn,
                    'clock_out' => $lastClockOut,
                    'first_event' => $firstEvent,
                    'last_event' => $lastEvent,
                    'total_seconds' => $totalSeconds,
                    'break_seconds' => $breakSeconds,
                    'unapproved_break_seconds' => $unapprovedBreakSeconds,
                    'overtime_seconds' => $overtimeSeconds,
                    'late_minutes' => $lateMinutes,
                    'has_open_shift' => $hasOpenShift,
                    'status' => $status,
                    'source' => $source,
                    'version' => $version,
                    'updated_at' => now(),
                ]
            );

            return $dayRecord->fresh()->toArray();
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("reconcileDay failed for user {$userId} on {$date}: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            
            // Make the failure visible by creating or updating the day record with a flag
            $dayRecord = AttendanceDay::updateOrCreate(
                ['user_id' => $userId, 'date' => $date],
                ['is_flagged' => true]
            );
            return $dayRecord->toArray();
        }
    }
}
