<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\LeaveRequest;
use App\Services\ApprovalService;
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
        $founder = User::where('username', 'founder')->first() ?? User::first();

        $today = Carbon::today();

        // 1. Approved leave in the past (Praveen)
        if ($praveen) {
            $leave = LeaveRequest::create([
                'user_id' => $praveen->id,
                'type' => 'casual',
                'start_date' => $today->copy()->subDays(5)->toDateString(),
                'end_date' => $today->copy()->subDays(4)->toDateString(),
                'status' => 'pending',
                'reason' => 'Family function',
            ]);

            $approval = ApprovalService::submit($leave, $praveen->id, [
                'type' => 'casual',
                'reason' => 'Family function',
            ]);
            $leave->update(['approval_id' => $approval->id]);

            // Decided by HR (Aravind) or Founder
            $decider = $aravind ?? $founder;
            ApprovalService::approve($approval, $decider->id, 'Approved by HR');
        }

        // 2. Pending leave in the future (Rahul) - for HR Approval Queue
        if ($rahul) {
            $leave = LeaveRequest::create([
                'user_id' => $rahul->id,
                'type' => 'casual',
                'start_date' => $today->copy()->addDays(2)->toDateString(),
                'end_date' => $today->copy()->addDays(3)->toDateString(),
                'status' => 'pending',
                'reason' => 'Doctor appointment',
            ]);

            $approval = ApprovalService::submit($leave, $rahul->id, [
                'type' => 'casual',
                'reason' => 'Doctor appointment',
            ]);
            $leave->update(['approval_id' => $approval->id]);
        }

        // 3. Rejected leave (Vignesh)
        if ($vignesh) {
            $leave = LeaveRequest::create([
                'user_id' => $vignesh->id,
                'type' => 'casual',
                'start_date' => $today->copy()->subDays(10)->toDateString(),
                'end_date' => $today->copy()->subDays(10)->toDateString(),
                'status' => 'pending',
                'reason' => 'Personal work',
            ]);

            $approval = ApprovalService::submit($leave, $vignesh->id, [
                'type' => 'casual',
                'reason' => 'Personal work',
            ]);
            $leave->update(['approval_id' => $approval->id]);

            $decider = $aravind ?? $founder;
            ApprovalService::reject($approval, $decider->id, 'Insufficient leave balance');
        }

        // 4. Pending leave for HR member (Aravind) - for Admin Approval Queue
        if ($aravind) {
            $leave = LeaveRequest::create([
                'user_id' => $aravind->id,
                'type' => 'sick',
                'start_date' => $today->copy()->addDays(5)->toDateString(),
                'end_date' => $today->copy()->addDays(5)->toDateString(),
                'status' => 'pending',
                'reason' => 'Sick leave',
            ]);

            $approval = ApprovalService::submit($leave, $aravind->id, [
                'type' => 'sick',
                'reason' => 'Sick leave',
            ]);
            $leave->update(['approval_id' => $approval->id]);
        }
    }
}
