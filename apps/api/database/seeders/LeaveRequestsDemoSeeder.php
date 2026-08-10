<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LeaveRequestsDemoSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();
        if ($users->isEmpty()) {
            return;
        }

        $praveen = User::where('username', 'praveen')->first();
        $rahul = User::where('username', 'rahul')->first();
        $vignesh = User::where('username', 'vignesh')->first();
        $aravind = User::where('username', 'aravind')->first(); // HR member

        $today = Carbon::today();

        // 1. Approved leave in the past (Praveen)
        if ($praveen) {
            $startDate = $today->copy()->subDays(5);
            $endDate = $today->copy()->subDays(4);
            DB::table('leave_requests')->insert([
                'user_id' => $praveen->id,
                'type' => 'casual',
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => 'approved',
                'reason' => 'Family function',
                'created_at' => $today->copy()->subDays(10),
                'updated_at' => $today->copy()->subDays(8),
            ]);
        }

        // 2. Pending leave in the future (Rahul) - for HR Approval Queue
        if ($rahul) {
            $startDate = $today->copy()->addDays(2);
            $endDate = $today->copy()->addDays(3);
            DB::table('leave_requests')->insert([
                'user_id' => $rahul->id,
                'type' => 'casual',
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => 'pending',
                'reason' => 'Doctor appointment',
                'created_at' => $today->copy()->subDays(1),
                'updated_at' => $today->copy()->subDays(1),
            ]);
        }

        // 3. Rejected leave (Vignesh)
        if ($vignesh) {
            $startDate = $today->copy()->subDays(10);
            $endDate = $today->copy()->subDays(10);
            DB::table('leave_requests')->insert([
                'user_id' => $vignesh->id,
                'type' => 'casual',
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => 'rejected',
                'reason' => 'Personal work',
                'created_at' => $today->copy()->subDays(15),
                'updated_at' => $today->copy()->subDays(14),
            ]);
        }

        // 4. Pending leave for HR member (Aravind) - for Admin Approval Queue
        if ($aravind) {
            $startDate = $today->copy()->addDays(5);
            $endDate = $today->copy()->addDays(5);
            DB::table('leave_requests')->insert([
                'user_id' => $aravind->id,
                'type' => 'sick',
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => 'pending',
                'reason' => 'Sick leave',
                'created_at' => $today->copy()->subDays(2),
                'updated_at' => $today->copy()->subDays(2),
            ]);
        }
    }
}
