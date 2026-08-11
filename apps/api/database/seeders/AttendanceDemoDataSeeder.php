<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Services\AttendanceService;

class AttendanceDemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();
        if ($users->isEmpty()) {
            return;
        }

        $service = app(AttendanceService::class);
        $today = Carbon::today();
        $holidays = DB::table('holidays')->pluck('date')->map(fn($d) => substr($d, 5, 5))->toArray();

        for ($i = 7; $i >= 0; $i--) {
            $date = $today->copy()->subDays($i);
            
            if ($date->isSunday()) {
                continue;
            }

            if (in_array($date->format('m-d'), $holidays) || in_array($date->format('Y-m-d'), $holidays)) {
                continue;
            }

            foreach ($users as $user) {
                $rand = mt_rand(1, 100);
                if ($rand <= 15) {
                    continue; 
                }

                $clockInMinutes = mt_rand(-10, 20); 
                $clockInTime = $date->copy()->setHour(9)->setMinute(0)->addMinutes($clockInMinutes);

                DB::table('attendance_events')->upsert([
                    'user_id' => $user->id,
                    'type' => 'clock_in',
                    'timestamp' => $clockInTime,
                    'client_id' => 'seed_in_' . $user->id . '_' . $date->toDateString(),
                    'source' => 'server',
                    'created_at' => $clockInTime,
                    'updated_at' => $clockInTime,
                ], ['client_id'], ['type', 'timestamp']);

                if (mt_rand(1, 100) > 50) {
                    $breakStart = $date->copy()->setHour(13)->setMinute(mt_rand(0, 30));
                    $breakEnd = $breakStart->copy()->addMinutes(45);

                    DB::table('attendance_events')->upsert([
                        'user_id' => $user->id,
                        'type' => 'break_start',
                        'timestamp' => $breakStart,
                        'client_id' => 'seed_b_start_' . $user->id . '_' . $date->toDateString(),
                        'source' => 'server',
                        'created_at' => $breakStart,
                        'updated_at' => $breakStart,
                    ], ['client_id'], ['type', 'timestamp']);

                    DB::table('attendance_events')->upsert([
                        'user_id' => $user->id,
                        'type' => 'break_end',
                        'timestamp' => $breakEnd,
                        'client_id' => 'seed_b_end_' . $user->id . '_' . $date->toDateString(),
                        'source' => 'server',
                        'created_at' => $breakEnd,
                        'updated_at' => $breakEnd,
                    ], ['client_id'], ['type', 'timestamp']);
                }

                $shouldClockOut = true;
                if ($i === 0) {
                    $shouldClockOut = mt_rand(1, 100) > 50;
                } else if ($i === 1) {
                    if (in_array($user->username, ['praveen', 'raja'])) {
                        $shouldClockOut = false;
                    }
                }

                if ($shouldClockOut) {
                    $clockOutMinutes = mt_rand(-10, 40);
                    $clockOutTime = $date->copy()->setHour(18)->setMinute(30)->addMinutes($clockOutMinutes);
                    
                    if ($clockOutTime->isPast()) {
                        DB::table('attendance_events')->upsert([
                            'user_id' => $user->id,
                            'type' => 'clock_out',
                            'timestamp' => $clockOutTime,
                            'client_id' => 'seed_out_' . $user->id . '_' . $date->toDateString(),
                            'source' => 'server',
                            'created_at' => $clockOutTime,
                            'updated_at' => $clockOutTime,
                        ], ['client_id'], ['type', 'timestamp']);
                    }
                }

                $service->reconcileDay($user->id, $date->toDateString());
            }
        }
    }
}
