<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use App\Models\Holiday;
use App\Models\User;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

#[Signature('reminders:holidays')]
#[Description('Sends reminders for upcoming holidays or company events')]
class SendHolidayReminders extends Command
{
    public function handle(NotificationService $notificationService)
    {
        // Get offset setting
        $offsetSetting = DB::table('settings')
            ->where('category', 'reminders')
            ->where('key', 'reminders.holiday_offset')
            ->value('value');
        
        $offsetDays = $offsetSetting ? json_decode($offsetSetting) : 10;
        
        $targetDate = Carbon::today()->addDays($offsetDays);
        $year = $targetDate->year;
        
        // Use the same logic as HolidayController
        $baseHolidays = Holiday::whereYear('date', $year)->get();
        $recurringHolidays = Holiday::where('recurring', true)->whereYear('date', '<', $year)->get();
        
        $expanded = $recurringHolidays->map(function ($h) use ($year) {
            $newH = clone $h;
            $newH->date = Carbon::parse($h->date)->setYear($year)->startOfDay();
            return $newH;
        });
        
        $allHolidays = $baseHolidays->concat($expanded);
        
        $upcomingHolidays = $allHolidays->filter(function ($h) use ($targetDate) {
            return Carbon::parse($h->date)->startOfDay()->equalTo($targetDate);
        });

        if ($upcomingHolidays->isEmpty()) {
            $this->info('No upcoming holidays or events on ' . $targetDate->toDateString());
            return;
        }

        $users = User::where('status', 'active')->get();

        foreach ($upcomingHolidays as $holiday) {
            $typeLabel = isset($holiday->type) && $holiday->type === 'event' ? 'event' : 'holiday';
            
            // Check if reminder was already sent
            $lockKey = "holiday_reminder_{$holiday->id}_{$year}";
            
            $alreadySent = DB::table('notifications')
                ->where('type', 'App\Notifications\SystemNotification')
                ->where('data', 'LIKE', "%{$lockKey}%")
                ->exists();
                
            if ($alreadySent) {
                continue;
            }

            foreach ($users as $user) {
                $notificationService->sendGlobalNotification(
                    $user,
                    "📌 Upcoming {$typeLabel}: {$holiday->name} is coming up on " . Carbon::parse($holiday->date)->format('M d, Y') . ".",
                    "/dashboard",
                    [
                        'lock_key' => $lockKey,
                        'holiday_id' => $holiday->id,
                    ]
                );
            }
            $this->info("Sent reminders for {$typeLabel}: {$holiday->name}");
        }
    }
}
