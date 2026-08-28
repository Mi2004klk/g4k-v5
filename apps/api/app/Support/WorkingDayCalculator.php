<?php

namespace App\Support;

use App\Models\User;
use App\Models\WorkSchedule;
use App\Models\Holiday;
use Carbon\Carbon;

class WorkingDayCalculator
{
    /**
     * Calculate the number of working days between two dates for a specific user.
     * Takes into account the user's assigned work schedule and system holidays.
     *
     * @param User|null $user
     * @param string|Carbon $startDate
     * @param string|Carbon $endDate
     * @return int
     */
    public static function calculate(?User $user, $startDate, $endDate): int
    {
        $days = 0;
        $current = Carbon::parse($startDate)->copy();
        $end = Carbon::parse($endDate);

        $workSchedule = null;
        if ($user && $user->work_schedule_id) {
            $workSchedule = WorkSchedule::find($user->work_schedule_id);
        }
        if (!$workSchedule) {
            $workSchedule = WorkSchedule::where('is_default', true)->first();
        }

        $workingDays = $workSchedule ? $workSchedule->working_days : [1, 2, 3, 4, 5]; // Default Mon-Fri
        if (!is_array($workingDays)) {
            $workingDays = [1, 2, 3, 4, 5];
        }

        $startYear = $current->year;
        $endYear = $end->year;
        
        $holidays = Holiday::where(function($q) use ($startYear, $endYear, $current, $end) {
            $q->whereBetween('date', [$current->format('Y-m-d'), $end->format('Y-m-d')])
              ->orWhere(function($subQ) use ($startYear, $endYear) {
                  $subQ->where('recurring', true)
                       ->whereYear('date', '<=', $endYear);
              });
        })->get();

        while ($current <= $end) {
            $isWorkingDay = in_array($current->isoWeekday(), $workingDays);
            
            $isHoliday = false;
            $dateStr = $current->toDateString();
            $monthDay = $current->format('m-d');
            
            foreach ($holidays as $h) {
                $hDateStr = Carbon::parse($h->date)->toDateString();
                $hMonthDay = Carbon::parse($h->date)->format('m-d');
                
                if (!empty($h->recurring) && $hMonthDay === '02-29' && $monthDay === '02-28' && !$current->isLeapYear()) {
                    $isHoliday = true;
                    break;
                }
                if ($dateStr === $hDateStr || (!empty($h->recurring) && $monthDay === $hMonthDay)) {
                    $isHoliday = true;
                    break;
                }
            }

            if ($isWorkingDay && !$isHoliday) {
                $days++;
            }
            $current->addDay();
        }

        return $days;
    }

    /**
     * Check if a specific date is a system holiday.
     *
     * @param string|Carbon $date
     * @return bool
     */
    public static function isHoliday($date): bool
    {
        $current = Carbon::parse($date);
        $dateStr = $current->toDateString();
        $monthDay = $current->format('m-d');
        $year = $current->year;

        $holidays = Holiday::where(function($q) use ($year, $dateStr) {
            $q->where('date', $dateStr)
              ->orWhere(function($subQ) use ($year) {
                  $subQ->where('recurring', true)
                       ->whereYear('date', '<=', $year);
              });
        })->get();

        foreach ($holidays as $h) {
            $hDateStr = Carbon::parse($h->date)->toDateString();
            $hMonthDay = Carbon::parse($h->date)->format('m-d');
            
            if (!empty($h->recurring) && $hMonthDay === '02-29' && $monthDay === '02-28' && !$current->isLeapYear()) {
                return true;
            }
            if ($dateStr === $hDateStr || (!empty($h->recurring) && $monthDay === $hMonthDay)) {
                return true;
            }
        }
        return false;
    }
}
