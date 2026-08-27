<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Department;
use App\Models\Project;
use App\Models\Task;
use App\Models\LeaveRequest;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Notification;
use App\Models\QuickNote;
use App\Models\Pin;
use App\Models\Announcement;
use App\Models\QaForm;
use App\Models\QaFormField;
use App\Models\QaSubmission;
use App\Models\AuditLog;
use Carbon\Carbon;

class Phase43ComprehensiveSeeder extends Seeder
{
    private $tag = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

    public function run(): void
    {
        $this->command->info("Starting Comprehensive Phase 43 Demo Seeder...");

        // Purge old demo data
        $oldTag = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
        $tags = [$oldTag, $this->tag];
        DB::table('attendance_events')->whereIn('demo_tag', $tags)->delete();
        DB::table('attendance_days')->whereIn('demo_tag', $tags)->delete();
        DB::table('task_time_logs')->whereIn('demo_tag', $tags)->delete();
        DB::table('task_comments')->whereIn('demo_tag', $tags)->delete();
        DB::table('task_activity')->whereIn('demo_tag', $tags)->delete();
        DB::table('task_assignees')->whereIn('task_id', function($q) use ($tags) { clone $q; $q->select('id')->from('tasks')->whereIn('demo_tag', $tags); })->delete();
        DB::table('approvals')->whereIn('demo_tag', $tags)->delete();
        DB::table('tasks')->whereIn('demo_tag', $tags)->delete();
        DB::table('project_phases')->whereIn('project_id', function($q) use ($tags) { clone $q; $q->select('id')->from('projects')->whereIn('demo_tag', $tags); })->delete();
        DB::table('project_members')->whereIn('project_id', function($q) use ($tags) { clone $q; $q->select('id')->from('projects')->whereIn('demo_tag', $tags); })->delete();
        DB::table('projects')->whereIn('demo_tag', $tags)->delete();
        DB::table('leave_requests')->whereIn('demo_tag', $tags)->delete();
        DB::table('messages')->whereIn('demo_tag', $tags)->delete();
        DB::table('conversations')->whereIn('demo_tag', $tags)->delete();
        DB::table('notifications')->whereIn('demo_tag', $tags)->delete();
        DB::table('quick_notes')->whereIn('demo_tag', $tags)->delete();
        DB::table('pins')->whereIn('demo_tag', $tags)->delete();
        DB::table('announcements')->whereIn('demo_tag', $tags)->delete();
        DB::table('qa_submissions')->whereIn('qa_form_id', function($q) use ($tags) { clone $q; $q->select('id')->from('qa_forms')->whereIn('demo_tag', $tags); })->delete();
        DB::table('qa_form_fields')->whereIn('qa_form_id', function($q) use ($tags) { clone $q; $q->select('id')->from('qa_forms')->whereIn('demo_tag', $tags); })->delete();
        DB::table('qa_forms')->whereIn('demo_tag', $tags)->delete();

        $users = User::all();
        if ($users->isEmpty()) {
            $this->command->error("No users found. Run db:seed first.");
            return;
        }

        $this->seedAvatars($users);
        $this->seedWorkSchedules();
        $this->seedAttendance($users);
        $this->seedLeaves($users);
        $this->seedProjectsAndTasks($users);
        $this->seedCommsAndNotifications($users);
        $this->seedSystemConfig($users);

        $this->command->info("Phase 43 Demo Seeder complete.");
    }

    private function seedAvatars($users)
    {
        return; 
    }

    private function seedWorkSchedules()
    {
        $this->command->info("Seeding Work Schedules...");
        DB::table('work_schedules')->updateOrInsert(
            ['name' => 'Night Shift Variant'],
            [
                'start_time' => '22:00:00',
                'end_time' => '06:00:00',
                'break_minutes' => 45,
                'grace_minutes' => 15,
                'standard_seconds' => 28800,
                'working_days' => json_encode([1, 2, 3, 4, 5]),
                'effective_from' => '2026-01-01',
                'is_default' => false,
                'demo_tag' => $this->tag,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    private function seedAttendance($users)
    {
        $this->command->info("Seeding Attendance (30 days up to yesterday)...");
        $service = app(\App\Services\AttendanceService::class);
        $today = Carbon::today();
        
        $cachedSchedule = \App\Models\WorkSchedule::where('is_default', true)->first();

        $events = [];
        $days = [];

        // 30 days up to yesterday
        foreach ($users as $user) {
            if ($user->username === 'newjoin') continue;

            $daysToSeed = in_array($user->username, ['karthik', 'aravind', 'praveen']) ? 30 : 7;

            for ($i = $daysToSeed; $i >= 1; $i--) {
                $date = $today->copy()->subDays($i);
                if ($date->isSunday()) continue;

                // Make specific days late/overtime based on modulus for variety
                if ($user->username === 'praveen' && $i % 7 === 2) {
                    $this->seedMultiSegmentDay($user, $date, $events, $days);
                } elseif ($user->username === 'dinesh' && $i % 9 === 0) {
                    $this->seedMidnightCrossingDay($user, $date, $events, $days);
                } elseif ($user->username === 'rahul' && $i % 8 === 0) {
                    $this->seedHalfDay($user, $date, $events, $days);
                } elseif ($user->username === 'ajith' && $i % 6 === 0) {
                    $this->seedOvertimeDay($user, $date, $events, $days);
                } elseif ($user->username === 'harish' && in_array($i, [5, 6, 7])) {
                    // Absent (on leave)
                    continue;
                } else {
                    $this->seedNormalDay($user, $date, $i, $events, $days);
                }
            }
        }
        
        foreach ($events as $e) {
            DB::table('attendance_events')->insertOrIgnore($e);
        }
        foreach ($days as $d) {
            DB::table('attendance_days')->insertOrIgnore($d);
        }
    }

    private function seedNormalDay($user, $date, $dayIndex, &$events, &$days) {
        $lateMinutes = 0;
        $earlyLeave = 0;
        
        if ($user->username === 'aravind' && $dayIndex % 11 === 0) $lateMinutes = 25;
        if ($user->username === 'praveen' && in_array($dayIndex, [12, 24])) $lateMinutes = 40;
        if ($user->username === 'nivetha' && $dayIndex % 14 === 0) $lateMinutes = 15;
        if ($user->username === 'lokesh' && $dayIndex % 13 === 0) $earlyLeave = 90;

        $cIn = $date->copy()->setHour(9)->setMinute(0)->addMinutes($lateMinutes);
        $cOut = $date->copy()->setHour(18)->setMinute(30)->subMinutes($earlyLeave);
        
        $totalSeconds = $cOut->diffInSeconds($cIn) - 3600; // 1 hour break

        $events[] = ['client_id' => 's_in_'.$user->id.'_'.$date->toDateString(), 'user_id' => $user->id, 'type' => 'clock_in', 'timestamp' => $cIn, 'source' => 'server', 'demo_tag' => $this->tag];
        $events[] = ['client_id' => 's_out_'.$user->id.'_'.$date->toDateString(), 'user_id' => $user->id, 'type' => 'clock_out', 'timestamp' => $cOut, 'source' => 'server', 'demo_tag' => $this->tag];
        $days[] = ['user_id' => $user->id, 'date' => $date->toDateString(), 'status' => 'present', 'total_seconds' => $totalSeconds, 'break_seconds' => 3600, 'overtime_seconds' => max(0, $totalSeconds - 28800), 'late_minutes' => $lateMinutes, 'clock_in' => clone $cIn, 'clock_out' => clone $cOut, 'first_event' => clone $cIn, 'last_event' => clone $cOut, 'created_at' => now(), 'updated_at' => now(), 'demo_tag' => $this->tag];
    }

    private function seedHalfDay($user, $date, &$events, &$days) {
        $cIn = $date->copy()->setHour(9)->setMinute(0);
        $cOut = $date->copy()->setHour(13)->setMinute(0);
        $totalSeconds = $cOut->diffInSeconds($cIn);

        $events[] = ['client_id' => 's_in_'.$user->id.'_'.$date->toDateString(), 'user_id' => $user->id, 'type' => 'clock_in', 'timestamp' => $cIn, 'source' => 'server', 'demo_tag' => $this->tag];
        $events[] = ['client_id' => 's_out_'.$user->id.'_'.$date->toDateString(), 'user_id' => $user->id, 'type' => 'clock_out', 'timestamp' => $cOut, 'source' => 'server', 'demo_tag' => $this->tag];
        $days[] = ['user_id' => $user->id, 'date' => $date->toDateString(), 'status' => 'half_day', 'total_seconds' => $totalSeconds, 'break_seconds' => 0, 'overtime_seconds' => 0, 'late_minutes' => 0, 'clock_in' => clone $cIn, 'clock_out' => clone $cOut, 'first_event' => clone $cIn, 'last_event' => clone $cOut, 'created_at' => now(), 'updated_at' => now(), 'demo_tag' => $this->tag];
    }

    private function seedOvertimeDay($user, $date, &$events, &$days) {
        $cIn = $date->copy()->setHour(9)->setMinute(0);
        $cOut = $date->copy()->setHour(20)->setMinute(30);
        $totalSeconds = $cOut->diffInSeconds($cIn) - 3600;

        $events[] = ['client_id' => 's_in_'.$user->id.'_'.$date->toDateString(), 'user_id' => $user->id, 'type' => 'clock_in', 'timestamp' => $cIn, 'source' => 'server', 'demo_tag' => $this->tag];
        $events[] = ['client_id' => 's_out_'.$user->id.'_'.$date->toDateString(), 'user_id' => $user->id, 'type' => 'clock_out', 'timestamp' => $cOut, 'source' => 'server', 'demo_tag' => $this->tag];
        $days[] = ['user_id' => $user->id, 'date' => $date->toDateString(), 'status' => 'present', 'total_seconds' => $totalSeconds, 'break_seconds' => 3600, 'overtime_seconds' => max(0, $totalSeconds - 28800), 'late_minutes' => 0, 'clock_in' => clone $cIn, 'clock_out' => clone $cOut, 'first_event' => clone $cIn, 'last_event' => clone $cOut, 'created_at' => now(), 'updated_at' => now(), 'demo_tag' => $this->tag];
    }

    private function seedMultiSegmentDay($user, $date, &$events, &$days) {
        $cIn1 = $date->copy()->setHour(9)->setMinute(0);
        $cOut1 = $date->copy()->setHour(12)->setMinute(0);
        $cIn2 = $date->copy()->setHour(13)->setMinute(0);
        $cOut2 = $date->copy()->setHour(18)->setMinute(30);
        $totalSeconds = $cOut1->diffInSeconds($cIn1) + $cOut2->diffInSeconds($cIn2);

        $events[] = ['client_id' => 's_in1_'.$user->id.'_'.$date->toDateString(), 'user_id' => $user->id, 'type' => 'clock_in', 'timestamp' => $cIn1, 'source' => 'server', 'demo_tag' => $this->tag];
        $events[] = ['client_id' => 's_out1_'.$user->id.'_'.$date->toDateString(), 'user_id' => $user->id, 'type' => 'clock_out', 'timestamp' => $cOut1, 'source' => 'server', 'demo_tag' => $this->tag];
        $events[] = ['client_id' => 's_in2_'.$user->id.'_'.$date->toDateString(), 'user_id' => $user->id, 'type' => 'clock_in', 'timestamp' => $cIn2, 'source' => 'server', 'demo_tag' => $this->tag];
        $events[] = ['client_id' => 's_out2_'.$user->id.'_'.$date->toDateString(), 'user_id' => $user->id, 'type' => 'clock_out', 'timestamp' => $cOut2, 'source' => 'server', 'demo_tag' => $this->tag];
        $days[] = ['user_id' => $user->id, 'date' => $date->toDateString(), 'status' => 'present', 'total_seconds' => $totalSeconds, 'break_seconds' => 3600, 'overtime_seconds' => max(0, $totalSeconds - 28800), 'late_minutes' => 0, 'clock_in' => clone $cIn1, 'clock_out' => clone $cOut2, 'first_event' => clone $cIn1, 'last_event' => clone $cOut2, 'created_at' => now(), 'updated_at' => now(), 'demo_tag' => $this->tag];
    }

    private function seedMidnightCrossingDay($user, $date, &$events, &$days) {
        $cIn = $date->copy()->setHour(22)->setMinute(0);
        $cOut = $date->copy()->addDay()->setHour(6)->setMinute(0);
        $totalSeconds = $cOut->diffInSeconds($cIn);

        $events[] = ['client_id' => 's_in_'.$user->id.'_'.$date->toDateString(), 'user_id' => $user->id, 'type' => 'clock_in', 'timestamp' => $cIn, 'source' => 'server', 'demo_tag' => $this->tag];
        $events[] = ['client_id' => 's_out_'.$user->id.'_'.$date->toDateString(), 'user_id' => $user->id, 'type' => 'clock_out', 'timestamp' => $cOut, 'source' => 'server', 'demo_tag' => $this->tag];
        $days[] = ['user_id' => $user->id, 'date' => $date->toDateString(), 'status' => 'present', 'total_seconds' => $totalSeconds, 'break_seconds' => 3600, 'overtime_seconds' => max(0, $totalSeconds - 28800), 'late_minutes' => 0, 'clock_in' => clone $cIn, 'clock_out' => clone $cOut, 'first_event' => clone $cIn, 'last_event' => clone $cOut, 'created_at' => now(), 'updated_at' => now(), 'demo_tag' => $this->tag];
    }

    private function seedLeaves($users)
    {
        $this->command->info("Seeding Leaves & Balances...");
        $hr = User::where('username', 'aravind')->first();
        $admin = User::where('username', 'karthik')->first();

        // Expansive leave requests covering multiple past months
        $scenarios = [
            ['u' => 'praveen', 'status' => 'approved', 'days' => 2, 'type' => 'casual', 'offset' => 3], 
            ['u' => 'rahul', 'status' => 'pending', 'days' => 1, 'type' => 'sick', 'offset' => 5], 
            ['u' => 'santhosh', 'status' => 'rejected', 'days' => 1, 'type' => 'casual', 'offset' => -3], 
            ['u' => 'harish', 'status' => 'approved', 'days' => 3, 'type' => 'earned', 'offset' => -7], 
            ['u' => 'dinesh', 'status' => 'pending', 'days' => 2, 'type' => 'casual', 'offset' => 10], 
            ['u' => 'lokesh', 'status' => 'approved', 'days' => 1, 'type' => 'unpaid', 'offset' => -10], 
            ['u' => 'akash', 'status' => 'rejected', 'days' => 2, 'type' => 'sick', 'offset' => -12], 
            ['u' => 'nivetha', 'status' => 'approved', 'days' => 1, 'type' => 'casual', 'offset' => 2], 
            ['u' => 'praveen', 'status' => 'approved', 'days' => 1, 'type' => 'sick', 'offset' => -20], 
            ['u' => 'karthik', 'status' => 'approved', 'days' => 1, 'type' => 'casual', 'offset' => -15], 
            ['u' => 'aravind', 'status' => 'approved', 'days' => 2, 'type' => 'earned', 'offset' => -25], 
        ];

        foreach ($scenarios as $s) {
            $u = $users->where('username', $s['u'])->first();
            if (!$u) continue;

            $start = Carbon::today()->addDays($s['offset']);
            $end = $start->copy()->addDays($s['days'] - 1);
            
            $req = LeaveRequest::firstOrCreate(
                ['user_id' => $u->id, 'start_date' => $start->toDateString()],
                [
                    'type' => $s['type'],
                    'end_date' => $end->toDateString(),
                    'status' => $s['status'],
                    'reason' => 'Family function / Personal',
                    'demo_tag' => $this->tag
                ]
            );

            $approvalData = [
                'submitted_by' => $u->id,
                'submitted_at' => $start->copy()->subDays(2),
                'status' => $s['status'],
                'current_approver_role' => 'hr',
                'demo_tag' => $this->tag,
                'created_at' => clone $start->copy()->subDays(2),
                'updated_at' => clone $start->copy()->subDays(1)
            ];

            if ($s['status'] === 'approved' || $s['status'] === 'rejected') {
                $approvalData['decided_by'] = $u->username === 'aravind' ? $admin->id : $hr->id;
                $approvalData['decision'] = $s['status'];
                $approvalData['decision_reason'] = $s['status'] === 'approved' ? 'Approved, have fun' : 'Too many people on leave';
                $approvalData['decided_at'] = $start->copy()->subDays(1);
            }

            DB::table('approvals')->updateOrInsert(
                ['approvable_type' => LeaveRequest::class, 'approvable_id' => $req->id],
                $approvalData
            );
        }

        // Leave Balances for everyone
        foreach ($users as $u) {
            $types = ['casual' => 12, 'sick' => 12, 'earned' => 15, 'unpaid' => 0];
            foreach ($types as $type => $allowed) {
                DB::table('leave_balances')->updateOrInsert(
                    ['user_id' => $u->id, 'leave_type' => $type, 'year' => date('Y')],
                    ['allowed' => $allowed, 'used' => rand(0, 8), 'demo_tag' => $this->tag, 'created_at' => now(), 'updated_at' => now()]
                );
            }
        }
    }

    private function seedProjectsAndTasks($users)
    {
        $this->command->info("Seeding Extensive Projects, Tasks, QA, Timers and Activities...");

        $karthik = $users->where('username', 'karthik')->first();
        $aravind = $users->where('username', 'aravind')->first();
        $praveen = $users->where('username', 'praveen')->first();
        $rahul = $users->where('username', 'rahul')->first();
        $santhosh = $users->where('username', 'santhosh')->first();
        $dinesh = $users->where('username', 'dinesh')->first();
        $ajith = $users->where('username', 'ajith')->first();
        $lokesh = $users->where('username', 'lokesh')->first();
        $harish = $users->where('username', 'harish')->first();
        $vignesh = $users->where('username', 'vignesh')->first();
        $akash = $users->where('username', 'akash')->first();
        $nivetha = $users->where('username', 'nivetha')->first();

        // 1. Escape Room 3D
        $p1 = Project::firstOrCreate(
            ['name' => 'Escape Room 3D'],
            [
                'description' => 'New 3D escape room game for Android.',
                'status' => 'active',
                'priority' => 'high',
                'start_date' => Carbon::now()->subMonths(2),
                'end_date' => Carbon::now()->addMonths(1),
                'department_id' => Department::where('name', 'Game Dev Team')->value('id'),
                'progress' => 65,
                'created_by' => $karthik->id,
                'is_demo' => true,
                'demo_tag' => $this->tag
            ]
        );
        $p1->members()->syncWithoutDetaching([$praveen->id, $rahul->id, $santhosh->id]);

        $phase1_1 = \App\Models\ProjectPhase::firstOrCreate(['project_id' => $p1->id, 'name' => 'Design'], ['status' => 'completed', 'sort_order' => 1, 'start_date' => Carbon::now()->subMonths(2), 'end_date' => Carbon::now()->subMonth(), 'completed_at' => Carbon::now()->subMonth()]);
        $phase1_2 = \App\Models\ProjectPhase::firstOrCreate(['project_id' => $p1->id, 'name' => 'Development'], ['status' => 'active', 'sort_order' => 2, 'start_date' => Carbon::now()->subMonth(), 'end_date' => Carbon::now()->addDays(15)]);
        $phase1_3 = \App\Models\ProjectPhase::firstOrCreate(['project_id' => $p1->id, 'name' => 'Testing'], ['status' => 'pending', 'sort_order' => 3, 'start_date' => Carbon::now()->addDays(16), 'end_date' => Carbon::now()->addMonths(1)]);

        // Escape Room Tasks (12 tasks)
        for ($i = 1; $i <= 12; $i++) {
            $phaseId = $i <= 3 ? $phase1_1->id : ($i <= 9 ? $phase1_2->id : $phase1_3->id);
            $status = $i <= 3 ? 'done' : ($i <= 6 ? 'review' : ($i <= 9 ? 'in_progress' : 'todo'));
            $assignee = $i % 3 === 0 ? $santhosh->id : ($i % 2 === 0 ? $rahul->id : $praveen->id);
            
            $createdAt = Carbon::now()->subDays(30)->addDays($i);

            $t = Task::firstOrCreate(
                ['project_id' => $p1->id, 'title' => "Level $i Implementation"],
                [
                    'phase_id' => $phaseId,
                    'description' => "Complete implementation of level $i.",
                    'assignee_id' => $assignee,
                    'status' => $status,
                    'priority' => 'high',
                    'due_date' => Carbon::now()->subDays(10)->addDays($i * 4),
                    'reporter_id' => $praveen->id,
                    'progress' => $status === 'done' ? 100 : ($status === 'review' ? 95 : ($status === 'in_progress' ? 50 : 0)),
                    'created_at' => $createdAt,
                    'demo_tag' => $this->tag
                ]
            );

            DB::table('task_assignees')->updateOrInsert(
                ['task_id' => $t->id, 'user_id' => $assignee],
                ['created_at' => $createdAt, 'updated_at' => $createdAt]
            );
            
            DB::table('task_activity')->updateOrInsert(
                ['task_id' => $t->id, 'event' => 'created'],
                ['user_id' => $praveen->id, 'created_at' => $createdAt, 'demo_tag' => $this->tag]
            );

            // Comments
            if (in_array($status, ['in_progress', 'review', 'done'])) {
                DB::table('task_comments')->updateOrInsert(
                    ['task_id' => $t->id, 'user_id' => $assignee],
                    ['body' => 'Making good progress on this. Checking the models.', 'demo_tag' => $this->tag, 'created_at' => $createdAt->copy()->addDays(1), 'updated_at' => clone $createdAt->copy()->addDays(1)]
                );
                
                DB::table('task_activity')->updateOrInsert(
                    ['task_id' => $t->id, 'event' => 'progress', 'metadata' => json_encode(['from' => 'todo', 'to' => 'in_progress'])],
                    ['user_id' => $assignee, 'created_at' => $createdAt->copy()->addDays(1), 'demo_tag' => $this->tag]
                );
            }

            // Timers (Multiple logs over the month up to yesterday)
            if (in_array($status, ['in_progress', 'done', 'review'])) {
                for ($day = 1; $day <= 5; $day++) {
                    $logDate = Carbon::yesterday()->subDays($day * 2);
                    if ($logDate->isBefore($createdAt)) break;
                    
                    DB::table('task_time_logs')->updateOrInsert(
                        ['task_id' => $t->id, 'user_id' => $assignee, 'log_date' => $logDate->toDateString()],
                        [
                            'project_id' => $p1->id,
                            'started_at' => clone $logDate->copy()->setHour(10),
                            'ended_at' => clone $logDate->copy()->setHour(14),
                            'minutes_logged' => rand(120, 240),
                            'description' => "Worked on implementation details day $day",
                            'demo_tag' => $this->tag,
                            'created_at' => clone $logDate,
                            'updated_at' => clone $logDate
                        ]
                    );
                }
            }

            // Submissions & QA
            if ($status === 'review') {
                $approval = \App\Models\Approval::firstOrCreate(
                    ['approvable_type' => Task::class, 'approvable_id' => $t->id],
                    ['submitted_by' => $assignee, 'current_approver_role' => 'hr', 'status' => 'pending', 'payload' => [], 'demo_tag' => $this->tag, 'created_at' => Carbon::yesterday(), 'updated_at' => Carbon::yesterday()]
                );
                
                DB::table('task_activity')->updateOrInsert(
                    ['task_id' => $t->id, 'event' => 'submitted'],
                    ['user_id' => $assignee, 'demo_tag' => $this->tag, 'created_at' => Carbon::yesterday()]
                );
            }
        }

        // 2. Summer Camp Vlog
        $p2 = Project::firstOrCreate(
            ['name' => 'Summer Camp Vlog'],
            [
                'description' => 'YouTube vlog for summer series.',
                'status' => 'active',
                'priority' => 'medium',
                'start_date' => Carbon::now()->subDays(10),
                'end_date' => Carbon::now()->addMonths(1),
                'department_id' => Department::where('name', 'YouTube Team')->value('id'),
                'progress' => 30,
                'created_by' => $karthik->id,
                'is_demo' => true,
                'demo_tag' => $this->tag
            ]
        );
        $p2->members()->syncWithoutDetaching([$dinesh->id, $ajith->id, $lokesh->id, $harish->id]);

        $phase2_1 = \App\Models\ProjectPhase::firstOrCreate(['project_id' => $p2->id, 'name' => 'Pre-production'], ['status' => 'completed', 'sort_order' => 1, 'start_date' => Carbon::now()->subDays(10), 'end_date' => Carbon::now()->subDays(2), 'completed_at' => Carbon::now()->subDays(2)]);
        $phase2_2 = \App\Models\ProjectPhase::firstOrCreate(['project_id' => $p2->id, 'name' => 'Filming'], ['status' => 'active', 'sort_order' => 2, 'start_date' => Carbon::now()->subDays(1), 'end_date' => Carbon::now()->addDays(15)]);

        // Vlog Tasks (8 tasks)
        for ($i = 1; $i <= 8; $i++) {
            $phaseId = $i <= 2 ? $phase2_1->id : $phase2_2->id;
            $status = $i <= 2 ? 'done' : ($i <= 4 ? 'review' : ($i <= 6 ? 'in_progress' : 'todo'));
            $assignee = $i % 2 === 0 ? $ajith->id : $lokesh->id;

            $t = Task::firstOrCreate(
                ['project_id' => $p2->id, 'title' => "Shoot Location $i"],
                [
                    'phase_id' => $phaseId,
                    'description' => "Shoot footage and b-roll for location $i.",
                    'assignee_id' => $assignee,
                    'status' => $status,
                    'priority' => 'medium',
                    'due_date' => Carbon::now()->addDays($i * 2),
                    'reporter_id' => $dinesh->id,
                    'created_at' => Carbon::now()->subDays(10),
                    'demo_tag' => $this->tag
                ]
            );

            DB::table('task_assignees')->updateOrInsert(
                ['task_id' => $t->id, 'user_id' => $assignee],
                ['created_at' => now(), 'updated_at' => now()]
            );

            if (in_array($status, ['in_progress', 'review', 'done'])) {
                DB::table('task_time_logs')->updateOrInsert(
                    ['task_id' => $t->id, 'user_id' => $assignee, 'log_date' => Carbon::yesterday()->toDateString()],
                    [
                        'project_id' => $p2->id,
                        'started_at' => Carbon::yesterday()->setHour(9),
                        'ended_at' => Carbon::yesterday()->setHour(12),
                        'minutes_logged' => 180,
                        'description' => 'Filming on location',
                        'demo_tag' => $this->tag,
                        'created_at' => Carbon::yesterday(),
                        'updated_at' => Carbon::yesterday()
                    ]
                );
            }
        }

        // 3. Brand Refresh 2026 (Completed)
        $p3 = Project::firstOrCreate(
            ['name' => 'Brand Refresh 2026'],
            [
                'description' => 'Overall company brand refresh.',
                'status' => 'completed',
                'priority' => 'medium',
                'start_date' => Carbon::now()->subMonths(3),
                'end_date' => Carbon::now()->subDays(5),
                'department_id' => Department::where('name', 'Marketing & Growth')->value('id'),
                'progress' => 100,
                'created_by' => $karthik->id,
                'is_demo' => true,
                'demo_tag' => $this->tag
            ]
        );
        $p3->members()->syncWithoutDetaching([$vignesh->id, $akash->id, $nivetha->id]);
        $phase3_1 = \App\Models\ProjectPhase::firstOrCreate(['project_id' => $p3->id, 'name' => 'Execution'], ['status' => 'completed', 'sort_order' => 1, 'completed_at' => Carbon::now()->subDays(5)]);

        for ($i = 1; $i <= 5; $i++) {
            $t = Task::firstOrCreate(
                ['project_id' => $p3->id, 'title' => "Brand Asset $i"],
                [
                    'phase_id' => $phase3_1->id,
                    'description' => "Create and finalize brand asset $i.",
                    'assignee_id' => $vignesh->id,
                    'status' => 'done',
                    'priority' => 'low',
                    'due_date' => Carbon::now()->subDays(10),
                    'reporter_id' => $vignesh->id,
                    'progress' => 100,
                    'demo_tag' => $this->tag
                ]
            );
            DB::table('task_assignees')->updateOrInsert(['task_id' => $t->id, 'user_id' => $vignesh->id], ['created_at' => now(), 'updated_at' => now()]);
        }

        // QA Forms & Submissions
        $qaForm = QaForm::firstOrCreate(
            ['title' => 'Game Release Checklist'],
            ['description' => 'Standard QA for new games.', 'created_by' => $dinesh->id, 'is_demo' => true, 'demo_tag' => $this->tag]
        );
        $p1->update(['qa_form_id' => $qaForm->id]);

        $field = QaFormField::firstOrCreate(
            ['qa_form_id' => $qaForm->id, 'label' => 'No crash on startup?'],
            ['field_type' => 'checkbox', 'order' => 1, 'demo_tag' => $this->tag]
        );
        $field2 = QaFormField::firstOrCreate(
            ['qa_form_id' => $qaForm->id, 'label' => 'Target FPS achieved?'],
            ['field_type' => 'select', 'options' => json_encode(['30fps', '60fps', '120fps']), 'order' => 2, 'demo_tag' => $this->tag]
        );

        $doneTasks = Task::where('project_id', $p1->id)->where('status', 'done')->get();
        foreach ($doneTasks as $dt) {
            QaSubmission::firstOrCreate(
                ['qa_form_id' => $qaForm->id, 'task_id' => $dt->id],
                [
                    'user_id' => $santhosh->id,
                    'values' => [$field->id => true, $field2->id => '60fps'],
                    'note' => 'QA passed smoothly on test devices.',
                    'demo_tag' => $this->tag,
                    'created_at' => Carbon::yesterday()->subDays(2)
                ]
            );
        }
    }

    private function seedCommsAndNotifications($users)
    {
        $this->command->info("Seeding Chat, Project Chat, & Comms (30 days of history)...");
        $karthik = $users->where('username', 'karthik')->first();
        $aravind = $users->where('username', 'aravind')->first();
        $praveen = $users->where('username', 'praveen')->first();
        $dinesh = $users->where('username', 'dinesh')->first();
        $vignesh = $users->where('username', 'vignesh')->first();

        // 1. Announcements
        $ann = Announcement::firstOrCreate(
            ['title' => 'Independence Day Holiday'],
            ['body' => 'Friendly reminder that tomorrow is a public holiday.', 'created_by' => $karthik->id, 'pinned_at' => Carbon::yesterday()->subDays(10), 'is_demo' => true, 'demo_tag' => $this->tag, 'created_at' => Carbon::yesterday()->subDays(10)]
        );
        DB::table('reactions')->updateOrInsert(
            ['reactable_type' => Announcement::class, 'reactable_id' => $ann->id, 'user_id' => $praveen->id],
            ['emoji' => '🎉', 'demo_tag' => $this->tag, 'created_at' => Carbon::yesterday()->subDays(9)]
        );
        
        Announcement::firstOrCreate(
            ['title' => 'New Project Kickoff: Brand Refresh'],
            ['body' => 'The brand refresh is officially kicking off. Great job marketing team!', 'created_by' => $vignesh->id, 'is_demo' => true, 'demo_tag' => $this->tag, 'created_at' => Carbon::yesterday()->subDays(20)]
        );

        // 2. Global Chat (30 days history)
        $global = Conversation::firstOrCreate(['scope' => 'global', 'name' => 'Company Wide'], ['is_demo' => true, 'demo_tag' => $this->tag]);
        $global->users()->syncWithoutDetaching($users->pluck('id')->toArray());

        $messages = ["Good morning team!", "Morning!", "Happy Monday everyone.", "Is the staging server down?", "It's back up now.", "Thanks!", "Who left their mug in the meeting room?", "That was me, sorry!"];
        for ($i = 30; $i >= 1; $i--) {
            Message::create(['conversation_id' => $global->id, 'sender_id' => $users->random()->id, 'body' => $messages[array_rand($messages)], 'demo_tag' => $this->tag, 'created_at' => Carbon::yesterday()->subDays($i)->addHours(rand(8, 18))]);
        }

        // 3. Project Chats
        $p1 = Project::where('name', 'Escape Room 3D')->first();
        if ($p1) {
            $p1Conv = Conversation::firstOrCreate(['scope' => 'project', 'project_id' => $p1->id], ['name' => $p1->name, 'is_demo' => true, 'demo_tag' => $this->tag]);
            $p1Conv->users()->syncWithoutDetaching($p1->members()->pluck('users.id')->toArray());
            
            $msgs = ["I've pushed the level assets.", "Checking them now.", "Looks good, the textures are much better.", "I'll start integrating them into Unity today.", "Let me know if you need any changes.", "Will do."];
            for ($i = 25; $i >= 1; $i--) {
                Message::create(['conversation_id' => $p1Conv->id, 'sender_id' => $p1->members->random()->id, 'body' => $msgs[array_rand($msgs)], 'demo_tag' => $this->tag, 'created_at' => Carbon::yesterday()->subDays($i)->addHours(rand(9, 17))]);
            }
        }

        $p2 = Project::where('name', 'Summer Camp Vlog')->first();
        if ($p2) {
            $p2Conv = Conversation::firstOrCreate(['scope' => 'project', 'project_id' => $p2->id], ['name' => $p2->name, 'is_demo' => true, 'demo_tag' => $this->tag]);
            $p2Conv->users()->syncWithoutDetaching($p2->members()->pluck('users.id')->toArray());
            
            $msgs = ["Did we get the B-roll?", "Yes, uploading now.", "Audio seems a bit clipped on take 2.", "We will fix it in post.", "Thanks."];
            for ($i = 10; $i >= 1; $i--) {
                Message::create(['conversation_id' => $p2Conv->id, 'sender_id' => $p2->members->random()->id, 'body' => $msgs[array_rand($msgs)], 'demo_tag' => $this->tag, 'created_at' => Carbon::yesterday()->subDays($i)->addHours(rand(9, 17))]);
            }
        }

        // 4. DMs
        $dm = Conversation::firstOrCreate(['scope' => 'direct', 'name' => null, 'is_demo' => true, 'demo_tag' => $this->tag]);
        $dm->users()->syncWithoutDetaching([$praveen->id, $aravind->id]);
        
        $dmMsgs = ["Hey Aravind, I need to take leave next week.", "Sure, please submit the request.", "Done.", "Approved."];
        foreach ($dmMsgs as $idx => $msgBody) {
             Message::create(['conversation_id' => $dm->id, 'body' => $msgBody, 'sender_id' => $idx % 2 === 0 ? $praveen->id : $aravind->id, 'demo_tag' => $this->tag, 'created_at' => Carbon::yesterday()->subDays(5)->addHours($idx)]);
        }

        // 5. Notifications
        Notification::firstOrCreate(
            ['user_id' => $praveen->id, 'title' => 'New Task Assigned'],
            ['body' => 'You have been assigned to Level 10 Implementation.', 'type' => 'task', 'read_at' => null, 'demo_tag' => $this->tag, 'created_at' => Carbon::yesterday()]
        );
        Notification::firstOrCreate(
            ['user_id' => $praveen->id, 'title' => 'Leave Approved'],
            ['body' => 'Your casual leave request has been approved.', 'type' => 'leave', 'read_at' => Carbon::yesterday(), 'demo_tag' => $this->tag, 'created_at' => Carbon::yesterday()]
        );
        Notification::firstOrCreate(
            ['user_id' => $aravind->id, 'title' => 'Leave Request Pending'],
            ['body' => 'Rahul has requested sick leave.', 'type' => 'leave', 'read_at' => null, 'demo_tag' => $this->tag, 'created_at' => Carbon::yesterday()]
        );
    }

    private function seedSystemConfig($users)
    {
        $this->command->info("Seeding Config, Logs, etc...");
        $karthik = $users->where('username', 'karthik')->first();
        $praveen = $users->where('username', 'praveen')->first();
        $aravind = $users->where('username', 'aravind')->first();

        DB::table('login_attempts')->updateOrInsert(
            ['identifier' => 'karthik', 'ip_address' => '127.0.0.1'],
            ['success' => false, 'demo_tag' => $this->tag, 'created_at' => Carbon::yesterday()->subHours(2)]
        );
        DB::table('password_reset_requests')->updateOrInsert(
            ['user_id' => $karthik->id],
            ['status' => 'pending', 'demo_tag' => $this->tag, 'created_at' => Carbon::yesterday()]
        );
        DB::table('feedback')->updateOrInsert(
            ['user_id' => $praveen->id],
            ['body' => 'The task board is slightly laggy on Firefox.', 'demo_tag' => $this->tag, 'created_at' => Carbon::yesterday()]
        );

        DB::table('quick_notes')->updateOrInsert(['user_id' => $karthik->id, 'body' => 'Review marketing budget next Tuesday.'], ['demo_tag' => $this->tag]);
        DB::table('quick_notes')->updateOrInsert(['user_id' => $praveen->id, 'body' => 'Remember to check Unity lighting plugin.'], ['demo_tag' => $this->tag]);
        DB::table('saved_views')->updateOrInsert(
            ['user_id' => $karthik->id, 'name' => 'My High Priority Tasks'],
            ['entity' => 'tasks', 'config' => json_encode(['priority' => 'high', 'status' => 'todo']), 'demo_tag' => $this->tag, 'created_at' => now()]
        );
        DB::table('saved_views')->updateOrInsert(
            ['user_id' => $aravind->id, 'name' => 'Pending Leaves'],
            ['entity' => 'leave', 'config' => json_encode(['status' => 'pending']), 'demo_tag' => $this->tag, 'created_at' => now()]
        );

        // Audit Logs (30 days history)
        for ($i = 0; $i < 40; $i++) {
            $user = $i % 3 === 0 ? $aravind : ($i % 2 === 0 ? $praveen : $karthik);
            $action = $i % 3 === 0 ? 'leave_approved' : ($i % 2 === 0 ? 'task_completed' : 'updated_setting');
            
            AuditLog::create([
                'user_id' => $user->id,
                'action' => $action,
                'subject_type' => $action === 'updated_setting' ? 'Setting' : ($action === 'task_completed' ? 'Task' : 'LeaveRequest'),
                'subject_id' => '1',
                'before' => [],
                'after' => ['status' => 'updated'],
                'ip' => '127.0.0.1',
                'meta' => ['user_agent' => 'Mozilla/5.0'],
                'at' => Carbon::yesterday()->subDays(rand(1, 30))->addHours(rand(1,23)),
                'demo_tag' => $this->tag
            ]);
        }
    }
}
