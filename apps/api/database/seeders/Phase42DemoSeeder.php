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

class Phase42DemoSeeder extends Seeder
{
    private $tag = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

    public function run(): void
    {
        $this->command->info("Starting Phase 42 Demo Seeder...");

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

        $this->command->info("Phase 42 Demo Seeder complete.");
    }

    private function seedAvatars($users)
    {
        return; // Avatars removed to prevent 404s (DM-3)
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
        $this->command->info("Seeding Attendance (7 days)...");
        $service = app(\App\Services\AttendanceService::class);
        $today = Carbon::today();
        
        $cachedSchedule = \App\Models\WorkSchedule::where('is_default', true)->first();

        // 7 days ending today
        foreach ($users as $user) {
            if ($user->username === 'newjoin') continue;

            for ($i = 7; $i >= 0; $i--) {
                $date = $today->copy()->subDays($i);
                if ($date->isSunday()) continue;

                // Scenarios
                if ($user->username === 'praveen' && $i === 2) {
                    $this->seedMultiSegmentDay($user, $date, $service, $cachedSchedule);
                } elseif ($user->username === 'dinesh' && $i === 3) {
                    $this->seedMidnightCrossingDay($user, $date, $service, $cachedSchedule);
                } elseif ($user->username === 'rahul' && $i === 4) {
                    $this->seedHalfDay($user, $date, $service, $cachedSchedule);
                } elseif ($user->username === 'ajith' && $i === 1) {
                    $this->seedOvertimeDay($user, $date, $service, $cachedSchedule);
                } elseif ($user->username === 'harish' && $i === 5) {
                    // Absent (on leave)
                    continue;
                } else {
                    $this->seedNormalDay($user, $date, $service, $cachedSchedule, $i);
                }
            }
        }
    }

    private function seedNormalDay($user, $date, $service, $cachedSchedule, $dayIndex) {
        // Late arrivals for specific users
        $lateMinutes = 0;
        $earlyLeave = 0;
        
        if ($user->username === 'aravind' && $dayIndex === 2) $lateMinutes = 25;
        if ($user->username === 'praveen' && in_array($dayIndex, [1, 4])) $lateMinutes = 40;
        if ($user->username === 'nivetha' && $dayIndex === 3) $lateMinutes = 15;
        if ($user->username === 'lokesh' && $dayIndex === 5) $earlyLeave = 90;

        $cIn = $date->copy()->setHour(9)->setMinute(0)->addMinutes($lateMinutes);
        $cOut = $date->copy()->setHour(18)->setMinute(30)->subMinutes($earlyLeave);

        if ($cIn->isPast()) {
            DB::table('attendance_events')->updateOrInsert(
                ['client_id' => 's_in_'.$user->id.'_'.$date->toDateString()],
                ['user_id' => $user->id, 'type' => 'clock_in', 'timestamp' => $cIn, 'source' => 'server', 'demo_tag' => $this->tag]
            );
        }
        if ($cOut->isPast()) {
            DB::table('attendance_events')->updateOrInsert(
                ['client_id' => 's_out_'.$user->id.'_'.$date->toDateString()],
                ['user_id' => $user->id, 'type' => 'clock_out', 'timestamp' => $cOut, 'source' => 'server', 'demo_tag' => $this->tag]
            );
        }
        
        if ($cIn->isPast() || $cOut->isPast()) {
            $service->reconcileDay($user->id, $date->toDateString(), false, $user, $cachedSchedule);
        }
    }

    private function seedHalfDay($user, $date, $service, $cachedSchedule) {
        $cIn = $date->copy()->setHour(9)->setMinute(0);
        $cOut = $date->copy()->setHour(13)->setMinute(0);

        if ($cIn->isPast()) {
            DB::table('attendance_events')->updateOrInsert(
                ['client_id' => 's_in_'.$user->id.'_'.$date->toDateString()],
                ['user_id' => $user->id, 'type' => 'clock_in', 'timestamp' => $cIn, 'source' => 'server', 'demo_tag' => $this->tag]
            );
        }
        if ($cOut->isPast()) {
            DB::table('attendance_events')->updateOrInsert(
                ['client_id' => 's_out_'.$user->id.'_'.$date->toDateString()],
                ['user_id' => $user->id, 'type' => 'clock_out', 'timestamp' => $cOut, 'source' => 'server', 'demo_tag' => $this->tag]
            );
        }
        $service->reconcileDay($user->id, $date->toDateString(), false, $user, $cachedSchedule);
    }

    private function seedOvertimeDay($user, $date, $service, $cachedSchedule) {
        $cIn = $date->copy()->setHour(9)->setMinute(0);
        $cOut = $date->copy()->setHour(20)->setMinute(30);

        if ($cIn->isPast()) {
            DB::table('attendance_events')->updateOrInsert(
                ['client_id' => 's_in_'.$user->id.'_'.$date->toDateString()],
                ['user_id' => $user->id, 'type' => 'clock_in', 'timestamp' => $cIn, 'source' => 'server', 'demo_tag' => $this->tag]
            );
        }
        if ($cOut->isPast()) {
            DB::table('attendance_events')->updateOrInsert(
                ['client_id' => 's_out_'.$user->id.'_'.$date->toDateString()],
                ['user_id' => $user->id, 'type' => 'clock_out', 'timestamp' => $cOut, 'source' => 'server', 'demo_tag' => $this->tag]
            );
        }
        $service->reconcileDay($user->id, $date->toDateString(), false, $user, $cachedSchedule);
    }

    private function seedMultiSegmentDay($user, $date, $service, $cachedSchedule) {
        $cIn1 = $date->copy()->setHour(9)->setMinute(0);
        $cOut1 = $date->copy()->setHour(12)->setMinute(0);
        $cIn2 = $date->copy()->setHour(13)->setMinute(0);
        $cOut2 = $date->copy()->setHour(18)->setMinute(30);

        if ($cIn1->isPast()) {
            DB::table('attendance_events')->updateOrInsert(
                ['client_id' => 's_in1_'.$user->id.'_'.$date->toDateString()],
                ['user_id' => $user->id, 'type' => 'clock_in', 'timestamp' => $cIn1, 'source' => 'server', 'demo_tag' => $this->tag]
            );
            DB::table('attendance_events')->updateOrInsert(
                ['client_id' => 's_out1_'.$user->id.'_'.$date->toDateString()],
                ['user_id' => $user->id, 'type' => 'clock_out', 'timestamp' => $cOut1, 'source' => 'server', 'demo_tag' => $this->tag]
            );
        }
        if ($cIn2->isPast()) {
            DB::table('attendance_events')->updateOrInsert(
                ['client_id' => 's_in2_'.$user->id.'_'.$date->toDateString()],
                ['user_id' => $user->id, 'type' => 'clock_in', 'timestamp' => $cIn2, 'source' => 'server', 'demo_tag' => $this->tag]
            );
        }
        if ($cOut2->isPast()) {
             DB::table('attendance_events')->updateOrInsert(
                ['client_id' => 's_out2_'.$user->id.'_'.$date->toDateString()],
                ['user_id' => $user->id, 'type' => 'clock_out', 'timestamp' => $cOut2, 'source' => 'server', 'demo_tag' => $this->tag]
            );
        }
        $service->reconcileDay($user->id, $date->toDateString(), false, $user, $cachedSchedule);
    }

    private function seedMidnightCrossingDay($user, $date, $service, $cachedSchedule) {
        $cIn = $date->copy()->setHour(22)->setMinute(0);
        $cOut = $date->copy()->addDay()->setHour(6)->setMinute(0);

        if ($cIn->isPast()) {
            DB::table('attendance_events')->updateOrInsert(
                ['client_id' => 's_in_'.$user->id.'_'.$date->toDateString()],
                ['user_id' => $user->id, 'type' => 'clock_in', 'timestamp' => $cIn, 'source' => 'server', 'demo_tag' => $this->tag]
            );
        }
        if ($cOut->isPast()) {
            DB::table('attendance_events')->updateOrInsert(
                ['client_id' => 's_out_'.$user->id.'_'.$date->toDateString()],
                ['user_id' => $user->id, 'type' => 'clock_out', 'timestamp' => $cOut, 'source' => 'server', 'demo_tag' => $this->tag]
            );
        }
        $service->reconcileDay($user->id, $date->toDateString(), false, $user, $cachedSchedule);
    }

    private function seedLeaves($users)
    {
        $this->command->info("Seeding Leaves & Balances...");
        $hr = User::where('username', 'aravind')->first();

        // 8 leave requests covering different status and types
        $scenarios = [
            ['u' => 'praveen', 'status' => 'approved', 'days' => 2, 'type' => 'casual', 'offset' => 3], // Future
            ['u' => 'rahul', 'status' => 'pending', 'days' => 1, 'type' => 'sick', 'offset' => 5], // Future
            ['u' => 'santhosh', 'status' => 'rejected', 'days' => 1, 'type' => 'casual', 'offset' => -3], // Past
            ['u' => 'harish', 'status' => 'approved', 'days' => 1, 'type' => 'earned', 'offset' => -5], // Past, absent during 7 days
            ['u' => 'dinesh', 'status' => 'pending', 'days' => 2, 'type' => 'casual', 'offset' => 10], // Future
            ['u' => 'lokesh', 'status' => 'approved', 'days' => 1, 'type' => 'unpaid', 'offset' => -10], // Past
            ['u' => 'akash', 'status' => 'rejected', 'days' => 2, 'type' => 'sick', 'offset' => -12], // Past
            ['u' => 'nivetha', 'status' => 'approved', 'days' => 1, 'type' => 'casual', 'offset' => 2], // Future
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
                'submitted_at' => now()->subDays(15),
                'status' => $s['status'],
                'current_approver_role' => 'hr',
                'demo_tag' => $this->tag,
                'created_at' => now()->subDays(15),
                'updated_at' => now()->subDays(14)
            ];

            if ($s['status'] === 'approved' || $s['status'] === 'rejected') {
                $approvalData['decided_by'] = $hr->id;
                $approvalData['decision'] = $s['status'];
                $approvalData['decision_reason'] = $s['status'] === 'approved' ? 'Approved, have fun' : 'Too many people on leave';
                $approvalData['decided_at'] = now()->subDays(14);
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
                    ['allowed' => $allowed, 'used' => rand(0, 5), 'demo_tag' => $this->tag, 'created_at' => now(), 'updated_at' => now()]
                );
            }
        }
    }

    private function seedProjectsAndTasks($users)
    {
        $this->command->info("Seeding Projects, Tasks, QA, and Timers...");

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

        // 1. Escape Room 3D (Active, Game Dev)
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
                    'demo_tag' => $this->tag
                ]
            );

            DB::table('task_assignees')->updateOrInsert(
                ['task_id' => $t->id, 'user_id' => $assignee],
                ['created_at' => now(), 'updated_at' => now()]
            );

            // Comments
            if (in_array($status, ['in_progress', 'review'])) {
                DB::table('task_comments')->updateOrInsert(
                    ['task_id' => $t->id, 'user_id' => $praveen->id],
                    ['body' => 'Making good progress on this.', 'demo_tag' => $this->tag, 'created_at' => now()->subDays(2), 'updated_at' => now()->subDays(2)]
                );
            }

            // Timers (Last 7 days)
            if (in_array($status, ['in_progress', 'done', 'review'])) {
                DB::table('task_time_logs')->updateOrInsert(
                    ['task_id' => $t->id, 'user_id' => $assignee, 'log_date' => now()->subDays(rand(1, 6))->toDateString()],
                    [
                        'project_id' => $p1->id,
                        'started_at' => now()->subDays(2)->setHour(10),
                        'ended_at' => now()->subDays(2)->setHour(14),
                        'minutes_logged' => rand(120, 240),
                        'description' => 'Worked on implementation details',
                        'demo_tag' => $this->tag,
                        'created_at' => now()->subDays(2),
                        'updated_at' => now()->subDays(2)
                    ]
                );
            }

            // Submissions & QA
            if ($status === 'review') {
                $approval = \App\Models\Approval::firstOrCreate(
                    ['approvable_type' => Task::class, 'approvable_id' => $t->id],
                    ['submitted_by' => $assignee, 'current_approver_role' => 'hr', 'status' => 'pending', 'payload' => [], 'demo_tag' => $this->tag]
                );
                
                DB::table('task_activity')->updateOrInsert(
                    ['task_id' => $t->id, 'event' => 'submitted'],
                    ['user_id' => $assignee, 'demo_tag' => $this->tag, 'created_at' => now()->subHours(5)]
                );
            }
        }

        // 2. Summer Camp Vlog (Active, YouTube)
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
                    'demo_tag' => $this->tag
                ]
            );

            DB::table('task_assignees')->updateOrInsert(
                ['task_id' => $t->id, 'user_id' => $assignee],
                ['created_at' => now(), 'updated_at' => now()]
            );

            if ($status === 'in_progress') {
                DB::table('task_time_logs')->updateOrInsert(
                    ['task_id' => $t->id, 'user_id' => $assignee, 'log_date' => now()->toDateString()],
                    [
                        'project_id' => $p2->id,
                        'started_at' => now()->subHours(4),
                        'ended_at' => now()->subHours(1),
                        'minutes_logged' => 180,
                        'description' => 'Filming on location',
                        'demo_tag' => $this->tag,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]
                );
            }
        }

        // 3. Brand Refresh (Completed, Marketing)
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

        // Brand Tasks (5 tasks)
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

        // 4. Standalone tasks
        Task::firstOrCreate(
            ['title' => 'Monthly Payroll Processing'],
            ['description' => 'Process salary for all employees.', 'assignee_id' => $aravind->id, 'status' => 'in_progress', 'priority' => 'high', 'due_date' => Carbon::now()->addDays(2), 'demo_tag' => $this->tag]
        );
        Task::firstOrCreate(
            ['title' => 'Server Maintenance'],
            ['description' => 'Database indexing and backup verification.', 'assignee_id' => $karthik->id, 'status' => 'todo', 'priority' => 'urgent', 'due_date' => Carbon::now()->addDays(1), 'demo_tag' => $this->tag]
        );
        Task::firstOrCreate(
            ['title' => 'Update Personal Profile'],
            ['description' => 'Upload new headshot.', 'assignee_id' => $praveen->id, 'status' => 'todo', 'priority' => 'low', 'due_date' => Carbon::now()->addDays(5), 'demo_tag' => $this->tag]
        );

        // 5. QA Forms & Submissions
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
                    'demo_tag' => $this->tag
                ]
            );
        }
    }

    private function seedCommsAndNotifications($users)
    {
        $this->command->info("Seeding Chat & Comms...");
        $karthik = $users->where('username', 'karthik')->first();
        $aravind = $users->where('username', 'aravind')->first();
        $praveen = $users->where('username', 'praveen')->first();
        $dinesh = $users->where('username', 'dinesh')->first();
        $vignesh = $users->where('username', 'vignesh')->first();

        // 1. Announcements
        $ann = Announcement::firstOrCreate(
            ['title' => 'Independence Day Holiday'],
            ['body' => 'Friendly reminder that tomorrow is a public holiday.', 'created_by' => $karthik->id, 'pinned_at' => now()->subDays(5), 'is_demo' => true, 'demo_tag' => $this->tag]
        );
        DB::table('reactions')->updateOrInsert(
            ['reactable_type' => Announcement::class, 'reactable_id' => $ann->id, 'user_id' => $praveen->id],
            ['emoji' => '🎉', 'demo_tag' => $this->tag, 'created_at' => now()]
        );
        
        Announcement::firstOrCreate(
            ['title' => 'New Project Kickoff: Brand Refresh'],
            ['body' => 'The brand refresh is officially kicking off. Great job marketing team!', 'created_by' => $vignesh->id, 'is_demo' => true, 'demo_tag' => $this->tag]
        );

        Announcement::firstOrCreate(
            ['title' => 'Reminder: Submit Timesheets'],
            ['body' => 'Please ensure all your tasks have time logged by EOD Friday.', 'created_by' => $aravind->id, 'is_demo' => true, 'demo_tag' => $this->tag]
        );

        // 2. Global Chat
        $global = Conversation::firstOrCreate(['scope' => 'global', 'name' => 'Company Wide'], ['is_demo' => true, 'demo_tag' => $this->tag]);
        $global->users()->syncWithoutDetaching($users->pluck('id')->toArray());

        if (Message::where('conversation_id', $global->id)->count() < 8) {
            $messages = ["Good morning team!", "Morning!", "Happy Monday everyone.", "Is the staging server down?", "It's back up now.", "Thanks!", "Who left their mug in the meeting room?", "That was me, sorry!"];
            foreach ($messages as $i => $body) {
                Message::create(['conversation_id' => $global->id, 'sender_id' => $users->random()->id, 'body' => $body, 'demo_tag' => $this->tag, 'created_at' => now()->subDays(2)->addHours($i)]);
            }
        }

        // 3. Project Chats
        $p1 = Project::where('name', 'Escape Room 3D')->first();
        if ($p1) {
            $p1Conv = Conversation::firstOrCreate(['scope' => 'project', 'project_id' => $p1->id], ['name' => $p1->name, 'is_demo' => true, 'demo_tag' => $this->tag]);
            $p1Conv->users()->syncWithoutDetaching($p1->members()->pluck('users.id')->toArray());
            if (Message::where('conversation_id', $p1Conv->id)->count() < 6) {
                $msgs = ["I've pushed the level 4 assets.", "Checking them now.", "Looks good, the textures are much better.", "I'll start integrating them into Unity today.", "Let me know if you need any changes.", "Will do."];
                foreach ($msgs as $i => $body) {
                    Message::create(['conversation_id' => $p1Conv->id, 'sender_id' => $p1->members->random()->id, 'body' => $body, 'demo_tag' => $this->tag, 'created_at' => now()->subDays(1)->addHours($i)]);
                }
            }
        }

        // 4. DMs
        $dm = Conversation::firstOrCreate(['scope' => 'direct', 'name' => null, 'is_demo' => true, 'demo_tag' => $this->tag]);
        $dm->users()->syncWithoutDetaching([$praveen->id, $dinesh->id]);
        if (Message::where('conversation_id', $dm->id)->count() < 4) {
            Message::create(['conversation_id' => $dm->id, 'body' => 'Hey Dinesh, when is the vlog releasing?', 'sender_id' => $praveen->id, 'demo_tag' => $this->tag, 'created_at' => now()->subHours(5)]);
            Message::create(['conversation_id' => $dm->id, 'body' => 'We are aiming for next Friday.', 'sender_id' => $dinesh->id, 'demo_tag' => $this->tag, 'created_at' => now()->subHours(4)]);
            Message::create(['conversation_id' => $dm->id, 'body' => 'Awesome, I will get the promo banners ready.', 'sender_id' => $praveen->id, 'demo_tag' => $this->tag, 'created_at' => now()->subHours(3)]);
            Message::create(['conversation_id' => $dm->id, 'body' => 'Perfect.', 'sender_id' => $dinesh->id, 'demo_tag' => $this->tag, 'created_at' => now()->subHours(2)]);
        }

        // 5. Notifications
        Notification::firstOrCreate(
            ['user_id' => $praveen->id, 'title' => 'New Task Assigned'],
            ['body' => 'You have been assigned to Level 10 Implementation.', 'type' => 'task', 'read_at' => null, 'demo_tag' => $this->tag]
        );
        Notification::firstOrCreate(
            ['user_id' => $praveen->id, 'title' => 'Leave Approved'],
            ['body' => 'Your casual leave request has been approved.', 'type' => 'leave', 'read_at' => now(), 'demo_tag' => $this->tag]
        );
        Notification::firstOrCreate(
            ['user_id' => $aravind->id, 'title' => 'Leave Request Pending'],
            ['body' => 'Rahul has requested sick leave.', 'type' => 'leave', 'read_at' => null, 'demo_tag' => $this->tag]
        );
        Notification::firstOrCreate(
            ['user_id' => $karthik->id, 'title' => 'Project Completed'],
            ['body' => 'Brand Refresh 2026 has been marked as completed.', 'type' => 'project', 'read_at' => null, 'demo_tag' => $this->tag]
        );
    }

    private function seedSystemConfig($users)
    {
        $this->command->info("Seeding Config, Logs, etc...");
        $karthik = $users->where('username', 'karthik')->first();
        $praveen = $users->where('username', 'praveen')->first();
        $aravind = $users->where('username', 'aravind')->first();

        // Security / Meta
        DB::table('login_attempts')->updateOrInsert(
            ['identifier' => 'karthik', 'ip_address' => '127.0.0.1'],
            ['success' => false, 'demo_tag' => $this->tag, 'created_at' => now()->subHours(2)]
        );
        DB::table('password_reset_requests')->updateOrInsert(
            ['user_id' => $karthik->id],
            ['status' => 'pending', 'demo_tag' => $this->tag, 'created_at' => now()]
        );
        DB::table('feedback')->updateOrInsert(
            ['user_id' => $praveen->id],
            ['body' => 'The task board is slightly laggy on Firefox.', 'demo_tag' => $this->tag, 'created_at' => now()]
        );

        // Notes & Views
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

        // Audit Logs (20+)
        if (AuditLog::where('user_id', $karthik->id)->where('action', 'updated_setting')->count() < 15) {
            for ($i = 0; $i < 25; $i++) {
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
                    'at' => now()->subHours($i * 5),
                    'demo_tag' => $this->tag
                ]);
            }
        }
    }
}
