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
        $this->command->info("Seeding Attendance (4 weeks)...");
        $service = app(\App\Services\AttendanceService::class);
        $today = Carbon::today();
        
        $cachedSchedule = \App\Models\WorkSchedule::where('is_default', true)->first();

        foreach ($users as $user) {
            if ($user->username === 'newjoin') continue;

            for ($i = 28; $i >= 0; $i--) {
                $date = $today->copy()->subDays($i);
                if ($date->isSunday()) continue;

                if ($user->username === 'praveen' && $i === 5) {
                    $this->seedMultiSegmentDay($user, $date, $service, $cachedSchedule);
                } elseif ($user->username === 'ajith' && $i === 10) {
                    $this->seedMidnightCrossingDay($user, $date, $service, $cachedSchedule);
                } elseif ($user->username === 'rahul' && $i === 15) {
                    $this->seedContinueShiftDay($user, $date, $service, $cachedSchedule);
                } else {
                    $this->seedAttendanceDay($user, $date, $service, $cachedSchedule);
                }
            }
        }
    }

    private function seedAttendanceDay($user, $date, $service, $cachedSchedule) {
        $lateMinutes = rand(0, 1) === 1 ? rand(5, 30) : 0;
        $earlyLeave = rand(0, 5) === 1 ? rand(10, 60) : 0;

        $cIn = $date->copy()->setHour(9)->setMinute(0)->addMinutes($lateMinutes);
        $cOut = $date->copy()->setHour(18)->setMinute(30)->subMinutes($earlyLeave);

        DB::table('attendance_events')->updateOrInsert(
            ['client_id' => 's_in_'.$user->id.'_'.$date->toDateString()],
            ['user_id' => $user->id, 'type' => 'clock_in', 'timestamp' => $cIn, 'source' => 'server', 'demo_tag' => $this->tag]
        );
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

        DB::table('attendance_events')->updateOrInsert(
            ['client_id' => 's_in1_'.$user->id.'_'.$date->toDateString()],
            ['user_id' => $user->id, 'type' => 'clock_in', 'timestamp' => $cIn1, 'source' => 'server', 'demo_tag' => $this->tag]
        );
        DB::table('attendance_events')->updateOrInsert(
            ['client_id' => 's_out1_'.$user->id.'_'.$date->toDateString()],
            ['user_id' => $user->id, 'type' => 'clock_out', 'timestamp' => $cOut1, 'source' => 'server', 'demo_tag' => $this->tag]
        );
        DB::table('attendance_events')->updateOrInsert(
            ['client_id' => 's_in2_'.$user->id.'_'.$date->toDateString()],
            ['user_id' => $user->id, 'type' => 'clock_in', 'timestamp' => $cIn2, 'source' => 'server', 'demo_tag' => $this->tag]
        );
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

        DB::table('attendance_events')->updateOrInsert(
            ['client_id' => 's_in_'.$user->id.'_'.$date->toDateString()],
            ['user_id' => $user->id, 'type' => 'clock_in', 'timestamp' => $cIn, 'source' => 'server', 'demo_tag' => $this->tag]
        );
        if ($cOut->isPast()) {
            DB::table('attendance_events')->updateOrInsert(
                ['client_id' => 's_out_'.$user->id.'_'.$date->toDateString()],
                ['user_id' => $user->id, 'type' => 'clock_out', 'timestamp' => $cOut, 'source' => 'server', 'demo_tag' => $this->tag]
            );
        }
        $service->reconcileDay($user->id, $date->toDateString(), false, $user, $cachedSchedule);
    }

    private function seedContinueShiftDay($user, $date, $service, $cachedSchedule) {
        $cIn = $date->copy()->setHour(9)->setMinute(0);
        $cOut = $date->copy()->addDay()->setHour(12)->setMinute(0);

        DB::table('attendance_events')->updateOrInsert(
            ['client_id' => 's_in_'.$user->id.'_'.$date->toDateString()],
            ['user_id' => $user->id, 'type' => 'clock_in', 'timestamp' => $cIn, 'source' => 'server', 'demo_tag' => $this->tag]
        );
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

        $scenarios = [
            ['u' => 'praveen', 'status' => 'approved', 'days' => 2],
            ['u' => 'rahul', 'status' => 'pending', 'days' => 1],
            ['u' => 'santhosh', 'status' => 'rejected', 'days' => 1],
            ['u' => 'harish', 'status' => 'approved', 'days' => 3],
            ['u' => 'dinesh', 'status' => 'pending', 'days' => 2],
            ['u' => 'lokesh', 'status' => 'approved', 'days' => 1],
            ['u' => 'akash', 'status' => 'rejected', 'days' => 2],
            ['u' => 'vignesh', 'status' => 'approved', 'days' => 4],
        ];

        foreach ($scenarios as $s) {
            $u = $users->where('username', $s['u'])->first();
            if (!$u) continue;

            $start = Carbon::today()->addDays(rand(1, 15));
            $end = $start->copy()->addDays($s['days'] - 1);
            
            $req = LeaveRequest::firstOrCreate(
                ['user_id' => $u->id, 'start_date' => $start->toDateString()],
                [
                    'type' => 'casual',
                    'end_date' => $end->toDateString(),
                    'status' => $s['status'],
                    'reason' => 'Family function',
                    'demo_tag' => $this->tag
                ]
            );

            $approvalData = [
                'submitted_by' => $u->id,
                'submitted_at' => now(),
                'status' => $s['status'],
                'current_approver_role' => 'hr',
                'demo_tag' => $this->tag,
                'created_at' => now(),
                'updated_at' => now()
            ];

            if ($s['status'] === 'approved' || $s['status'] === 'rejected') {
                $approvalData['decided_by'] = $hr->id;
                $approvalData['decision'] = $s['status'];
                $approvalData['decision_reason'] = $s['status'] === 'approved' ? 'Approved, have fun' : 'Too many people on leave';
                $approvalData['decided_at'] = now();
            }

            DB::table('approvals')->updateOrInsert(
                ['approvable_type' => LeaveRequest::class, 'approvable_id' => $req->id],
                $approvalData
            );

            DB::table('leave_balances')->updateOrInsert(
                ['user_id' => $u->id, 'leave_type' => 'casual', 'year' => date('Y')],
                ['allowed' => 12, 'used' => rand(0, 5), 'demo_tag' => $this->tag, 'created_at' => now(), 'updated_at' => now()]
            );
        }
    }

    private function seedProjectsAndTasks($users)
    {
        $this->command->info("Seeding Projects, Tasks, QA, and Timers...");

        $praveen = $users->where('username', 'praveen')->first();
        $rahul = $users->where('username', 'rahul')->first();
        $dinesh = $users->where('username', 'dinesh')->first();
        $ajith = $users->where('username', 'ajith')->first();

        // Projects
        $p1 = Project::firstOrCreate(
            ['name' => 'Escape Room 3D'],
            [
                'description' => 'New 3D escape room game for Android.',
                'status' => 'active',
                'start_date' => Carbon::now()->subMonths(2),
                'end_date' => Carbon::now()->addMonths(1),
                'department_id' => Department::where('name', 'Game Dev Team')->value('id'),
                'is_demo' => true,
                'demo_tag' => $this->tag
            ]
        );
        $p1->members()->syncWithoutDetaching([$praveen->id, $rahul->id, $dinesh->id, $ajith->id]);

        $p2 = Project::firstOrCreate(
            ['name' => 'Summer Camp Vlog'],
            [
                'description' => 'YouTube vlog for summer series.',
                'status' => 'active',
                'start_date' => Carbon::now()->addDays(10),
                'end_date' => Carbon::now()->addMonths(1),
                'department_id' => Department::where('name', 'YouTube Team')->value('id'),
                'is_demo' => true,
                'demo_tag' => $this->tag
            ]
        );
        $p2->members()->syncWithoutDetaching([$praveen->id, $dinesh->id, $ajith->id]);

        // Tasks
        for ($i = 1; $i <= 10; $i++) {
            $t = Task::firstOrCreate(
                ['project_id' => $p1->id, 'title' => "Level $i Design"],
                [
                    'description' => "Design level $i puzzles.",
                    'assignee_id' => $praveen->id,
                    'status' => $i < 3 ? 'done' : ($i < 5 ? 'review' : ($i < 7 ? 'in_progress' : 'todo')),
                    'priority' => 'high',
                    'due_date' => Carbon::now()->addDays($i * 2),
                    'reporter_id' => $praveen->id,
                    'demo_tag' => $this->tag
                ]
            );

            DB::table('task_assignees')->updateOrInsert(
                ['task_id' => $t->id, 'user_id' => $praveen->id],
                ['created_at' => now(), 'updated_at' => now()]
            );
            
            if ($i % 2 == 0) {
                DB::table('task_assignees')->updateOrInsert(
                    ['task_id' => $t->id, 'user_id' => $rahul->id],
                    ['created_at' => now(), 'updated_at' => now()]
                );
            }

            // Task Comments & Activities
            if ($i === 4 || $i === 5) {
                DB::table('task_comments')->updateOrInsert(
                    ['task_id' => $t->id, 'user_id' => $rahul->id],
                    [
                        'body' => 'Looks good, I will start unity implementation soon.',
                        'demo_tag' => $this->tag,
                        'created_at' => now()->subHours(5),
                        'updated_at' => now()->subHours(5)
                    ]
                );
                DB::table('task_activity')->updateOrInsert(
                    ['task_id' => $t->id, 'event' => 'progress'],
                    [
                        'user_id' => $praveen->id,
                        'metadata' => json_encode(['from' => 'todo', 'to' => 'in_progress']),
                        'demo_tag' => $this->tag,
                        'created_at' => now()->subDays(1)
                    ]
                );
            }

            // Task Time Logs
            if ($i < 4) {
                DB::table('task_time_logs')->updateOrInsert(
                    ['task_id' => $t->id],
                    [
                        'project_id' => $p1->id,
                        'user_id' => $praveen->id,
                        'started_at' => now()->subDays(2)->setHour(10),
                        'ended_at' => now()->subDays(2)->setHour(14),
                        'minutes_logged' => 240,
                        'description' => 'Completed design',
                        'log_date' => now()->subDays(2)->toDateString(),
                        'demo_tag' => $this->tag,
                        'created_at' => now()->subDays(2),
                        'updated_at' => now()->subDays(2)
                    ]
                );
            }
        }

        for ($i = 1; $i <= 5; $i++) {
            $t = Task::firstOrCreate(
                ['project_id' => $p2->id, 'title' => "Shoot Location $i"],
                [
                    'description' => "Shoot vlog footage at loc $i.",
                    'assignee_id' => $ajith->id,
                    'status' => $i === 2 ? 'review' : 'todo',
                    'priority' => 'medium',
                    'due_date' => Carbon::now()->addDays($i * 3 + 10),
                    'reporter_id' => $dinesh->id,
                    'demo_tag' => $this->tag
                ]
            );

            DB::table('task_assignees')->updateOrInsert(
                ['task_id' => $t->id, 'user_id' => $ajith->id],
                ['created_at' => now(), 'updated_at' => now()]
            );

            if ($i === 2) {
                // Seed an Approval for the task in review
                $approval = \App\Models\Approval::firstOrCreate(
                    ['approvable_type' => Task::class, 'approvable_id' => $t->id],
                    [
                        'submitted_by' => $ajith->id,
                        'current_approver_role' => 'hr',
                        'status' => 'pending',
                        'payload' => [],
                        'demo_tag' => $this->tag
                    ]
                );
                $t->update(['approval_id' => $approval->id]);
            }
        }

        // QA Form & Submissions
        $qaForm = QaForm::firstOrCreate(
            ['title' => 'Game Release Checklist'],
            [
                'description' => 'Standard QA for new games.',
                'created_by' => $dinesh->id,
                'is_demo' => true,
                'demo_tag' => $this->tag
            ]
        );
        $p1->update(['qa_form_id' => $qaForm->id]);

        $field = QaFormField::firstOrCreate(
            ['qa_form_id' => $qaForm->id, 'label' => 'No crash on startup?'],
            [
                'field_type' => 'checkbox',
                'order' => 1,
                'demo_tag' => $this->tag
            ]
        );

        QaSubmission::firstOrCreate(
            ['qa_form_id' => $qaForm->id, 'task_id' => Task::where('project_id', $p1->id)->first()->id],
            [
                'user_id' => $rahul->id,
                'values' => [$field->id => true],
                'note' => 'Tested on Android 13, smooth.',
                'demo_tag' => $this->tag
            ]
        );
    }

    private function seedCommsAndNotifications($users)
    {
        $this->command->info("Seeding Chat & Comms...");
        $karthik = $users->where('username', 'karthik')->first();
        $praveen = $users->where('username', 'praveen')->first();
        $dinesh = $users->where('username', 'dinesh')->first();

        // 1. Announcements & Reactions
        $ann = Announcement::firstOrCreate(
            ['title' => 'Company Annual Meet'],
            [
                'body' => 'We are hosting the annual meet next month. Be prepared!',
                'created_by' => $karthik->id,
                'is_demo' => true,
                'demo_tag' => $this->tag
            ]
        );
        
        DB::table('reactions')->updateOrInsert(
            ['reactable_type' => Announcement::class, 'reactable_id' => $ann->id, 'user_id' => $praveen->id],
            ['emoji' => '👍', 'demo_tag' => $this->tag, 'created_at' => now()]
        );
        DB::table('reactions')->updateOrInsert(
            ['reactable_type' => Announcement::class, 'reactable_id' => $ann->id, 'user_id' => $dinesh->id],
            ['emoji' => '🎉', 'demo_tag' => $this->tag, 'created_at' => now()]
        );

        // 2. Global Chat
        $global = Conversation::firstOrCreate(
            ['scope' => 'global', 'name' => 'Company Wide'],
            ['is_demo' => true, 'demo_tag' => $this->tag]
        );
        $global->users()->syncWithoutDetaching($users->pluck('id')->toArray());

        // 3. Project Chats
        $p1 = Project::where('name', 'Escape Room 3D')->first();
        if ($p1) {
            $p1Conv = Conversation::firstOrCreate(
                ['scope' => 'project', 'project_id' => $p1->id],
                ['name' => $p1->name, 'is_demo' => true, 'demo_tag' => $this->tag]
            );
            $p1Conv->users()->syncWithoutDetaching($p1->members()->pluck('users.id')->toArray());
        }

        $p2 = Project::where('name', 'Summer Camp Vlog')->first();
        if ($p2) {
            $p2Conv = Conversation::firstOrCreate(
                ['scope' => 'project', 'project_id' => $p2->id],
                ['name' => $p2->name, 'is_demo' => true, 'demo_tag' => $this->tag]
            );
            $p2Conv->users()->syncWithoutDetaching($p2->members()->pluck('users.id')->toArray());
        }

        // 4. Cross-dept DM
        $dm = Conversation::where('scope', 'direct')
            ->whereHas('users', function ($q) use ($praveen) { $q->where('users.id', $praveen->id); })
            ->whereHas('users', function ($q) use ($dinesh) { $q->where('users.id', $dinesh->id); })
            ->first();

        if (!$dm) {
            $dm = Conversation::create([
                'scope' => 'direct',
                'name' => null,
                'is_demo' => true, 
                'demo_tag' => $this->tag
            ]);
            $dm->users()->sync([$praveen->id, $dinesh->id]);
        }
        
        $dm->users()->syncWithoutDetaching([$praveen->id, $dinesh->id]);
        
        Message::firstOrCreate(
            ['conversation_id' => $dm->id, 'body' => 'Hey Dinesh, when is the vlog releasing? Need to coordinate marketing assets.'],
            ['sender_id' => $praveen->id, 'demo_tag' => $this->tag]
        );
        Message::firstOrCreate(
            ['conversation_id' => $dm->id, 'body' => 'We are aiming for next Friday.'],
            ['sender_id' => $dinesh->id, 'demo_tag' => $this->tag]
        );

        // 5. Group Chats
        $group = Conversation::firstOrCreate(
            ['scope' => 'group', 'name' => 'General Discussion'],
            ['is_demo' => true, 'demo_tag' => $this->tag]
        );
        $group->users()->syncWithoutDetaching($users->pluck('id')->toArray());
        
        if (Message::where('conversation_id', $group->id)->count() < 5) {
            $chatMessages = [
                "Hey everyone, just checking in. How are the new assets looking?",
                "They are coming along nicely! I should have a preview ready by EOD.",
                "Great! Can't wait to see them.",
                "Has anyone seen the latest build? The lighting feels a bit off.",
                "Yeah, I noticed that too. I'll take a look at the lightmaps later today."
            ];
            foreach ($chatMessages as $i => $body) {
                $sender = $users->random();
                Message::create([
                    'conversation_id' => $group->id,
                    'sender_id' => $sender->id,
                    'body' => $body,
                    'demo_tag' => $this->tag
                ]);
            }
        }

        // 6. Notifications
        Notification::firstOrCreate(
            ['user_id' => $praveen->id, 'title' => 'New Task Assigned'],
            [
                'body' => 'You have been assigned to Level 10 Design.',
                'type' => 'task',
                'read_at' => null,
                'demo_tag' => $this->tag
            ]
        );
        Notification::firstOrCreate(
            ['user_id' => $dinesh->id, 'title' => 'Leave Approved'],
            [
                'body' => 'Your leave request has been approved.',
                'type' => 'leave',
                'read_at' => now(),
                'demo_tag' => $this->tag
            ]
        );
    }

    private function seedSystemConfig($users)
    {
        $this->command->info("Seeding Config, Logs, etc...");
        $karthik = $users->where('username', 'karthik')->first();

        DB::table('login_attempts')->updateOrInsert(
            ['identifier' => 'karthik', 'ip_address' => '127.0.0.1'],
            ['success' => false, 'demo_tag' => $this->tag, 'created_at' => now()->subHours(2)]
        );

        DB::table('password_reset_requests')->updateOrInsert(
            ['user_id' => $karthik->id],
            ['status' => 'pending', 'demo_tag' => $this->tag, 'created_at' => now()]
        );

        DB::table('feedback')->updateOrInsert(
            ['user_id' => $users->where('username', 'praveen')->first()->id],
            ['body' => 'The task board is slightly laggy on Firefox.', 'demo_tag' => $this->tag, 'created_at' => now()]
        );

        DB::table('saved_views')->updateOrInsert(
            ['user_id' => $karthik->id, 'name' => 'My High Priority Tasks'],
            ['entity' => 'tasks', 'config' => json_encode(['priority' => 'high', 'status' => 'todo']), 'demo_tag' => $this->tag, 'created_at' => now()]
        );

        if (AuditLog::where('user_id', $karthik->id)->where('action', 'updated_setting')->count() < 15) {
            for ($i = 0; $i < 16; $i++) {
                AuditLog::create([
                    'user_id' => $karthik->id,
                    'action' => 'updated_setting',
                    'subject_type' => 'Setting',
                    'subject_id' => '1',
                    'before' => ['password.min_length' => 6],
                    'after' => ['password.min_length' => 8],
                    'ip' => '127.0.0.1',
                    'meta' => ['user_agent' => 'Mozilla/5.0'],
                    'at' => now(),
                    'demo_tag' => $this->tag
                ]);
            }
        }
    }
}
