<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
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
use Illuminate\Support\Str;

class Phase42DemoSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info("Starting Phase 42 Demo Seeder...");

        // Ensure users exist
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
        $this->command->info("Seeding Avatars...");
        $avatars = [
            'teams_1.png', 'teams_2.png', 'teams_3.png',
            'teams_4.png', 'teams_5.png', 'teams_6.png',
            'teams_7.png', 'teams_8.png', 'teams_9.png'
        ];
        foreach ($users as $index => $user) {
            $file = $avatars[$index % count($avatars)];
            $url = "/avatars/{$file}";
            DB::table('users')->where('id', $user->id)->update(['avatar_url' => $url]);
        }
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
        
        foreach ($users as $user) {
            if ($user->username === 'newjoin') continue; // Un-onboarded

            for ($i = 28; $i >= 0; $i--) {
                $date = $today->copy()->subDays($i);
                if ($date->isSunday()) continue;

                if ($user->username === 'praveen' && $i === 5) {
                    $this->seedMultiSegmentDay($user, $date, $service);
                } elseif ($user->username === 'ajith' && $i === 10) {
                    $this->seedMidnightCrossingDay($user, $date, $service);
                } elseif ($user->username === 'rahul' && $i === 15) {
                    $this->seedContinueShiftDay($user, $date, $service);
                } else {
                    $this->seedAttendanceDay($user, $date, $service);
                }
            }
        }
    }

    private function seedAttendanceDay($user, $date, $service) {
        $lateMinutes = rand(0, 1) === 1 ? rand(5, 30) : 0;
        $earlyLeave = rand(0, 5) === 1 ? rand(10, 60) : 0;

        $cIn = $date->copy()->setHour(9)->setMinute(0)->addMinutes($lateMinutes);
        $cOut = $date->copy()->setHour(18)->setMinute(30)->subMinutes($earlyLeave);

        DB::table('attendance_events')->insertOrIgnore([
            ['user_id' => $user->id, 'type' => 'clock_in', 'timestamp' => $cIn, 'client_id' => 's_in_'.$user->id.'_'.$date->toDateString(), 'source' => 'server'],
        ]);
        if ($cOut->isPast()) {
            DB::table('attendance_events')->insertOrIgnore([
                ['user_id' => $user->id, 'type' => 'clock_out', 'timestamp' => $cOut, 'client_id' => 's_out_'.$user->id.'_'.$date->toDateString(), 'source' => 'server'],
            ]);
        }
        $service->reconcileDay($user->id, $date->toDateString());
    }

    private function seedMultiSegmentDay($user, $date, $service) {
        $cIn1 = $date->copy()->setHour(9)->setMinute(0);
        $cOut1 = $date->copy()->setHour(12)->setMinute(0);
        $cIn2 = $date->copy()->setHour(13)->setMinute(0);
        $cOut2 = $date->copy()->setHour(18)->setMinute(30);

        DB::table('attendance_events')->insertOrIgnore([
            ['user_id' => $user->id, 'type' => 'clock_in', 'timestamp' => $cIn1, 'client_id' => 's_in1_'.$user->id.'_'.$date->toDateString(), 'source' => 'server'],
            ['user_id' => $user->id, 'type' => 'clock_out', 'timestamp' => $cOut1, 'client_id' => 's_out1_'.$user->id.'_'.$date->toDateString(), 'source' => 'server'],
            ['user_id' => $user->id, 'type' => 'clock_in', 'timestamp' => $cIn2, 'client_id' => 's_in2_'.$user->id.'_'.$date->toDateString(), 'source' => 'server'],
        ]);
        if ($cOut2->isPast()) {
             DB::table('attendance_events')->insertOrIgnore([
                ['user_id' => $user->id, 'type' => 'clock_out', 'timestamp' => $cOut2, 'client_id' => 's_out2_'.$user->id.'_'.$date->toDateString(), 'source' => 'server'],
            ]);
        }
        $service->reconcileDay($user->id, $date->toDateString());
    }

    private function seedMidnightCrossingDay($user, $date, $service) {
        $cIn = $date->copy()->setHour(22)->setMinute(0);
        $cOut = $date->copy()->addDay()->setHour(6)->setMinute(0);

        DB::table('attendance_events')->insertOrIgnore([
            ['user_id' => $user->id, 'type' => 'clock_in', 'timestamp' => $cIn, 'client_id' => 's_in_'.$user->id.'_'.$date->toDateString(), 'source' => 'server'],
        ]);
        if ($cOut->isPast()) {
            DB::table('attendance_events')->insertOrIgnore([
                ['user_id' => $user->id, 'type' => 'clock_out', 'timestamp' => $cOut, 'client_id' => 's_out_'.$user->id.'_'.$date->toDateString(), 'source' => 'server'],
            ]);
        }
        $service->reconcileDay($user->id, $date->toDateString());
    }

    private function seedContinueShiftDay($user, $date, $service) {
        $cIn = $date->copy()->setHour(9)->setMinute(0);
        $cOut = $date->copy()->addDay()->setHour(12)->setMinute(0);

        DB::table('attendance_events')->insertOrIgnore([
            ['user_id' => $user->id, 'type' => 'clock_in', 'timestamp' => $cIn, 'client_id' => 's_in_'.$user->id.'_'.$date->toDateString(), 'source' => 'server'],
        ]);
        if ($cOut->isPast()) {
            DB::table('attendance_events')->insertOrIgnore([
                ['user_id' => $user->id, 'type' => 'clock_out', 'timestamp' => $cOut, 'client_id' => 's_out_'.$user->id.'_'.$date->toDateString(), 'source' => 'server'],
            ]);
        }
        $service->reconcileDay($user->id, $date->toDateString());
    }

    private function seedLeaves($users)
    {
        $this->command->info("Seeding Leaves & Balances...");
        
        $hr = User::where('username', 'aravind')->first();

        // 8 leave scenarios
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
            
            $req = LeaveRequest::create([
                'user_id' => $u->id,
                'type' => 'casual',
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
                'status' => $s['status'],
                'reason' => 'Family function'
            ]);

            if ($s['status'] === 'approved' || $s['status'] === 'rejected') {
                DB::table('approvals')->insert([
                    'approvable_type' => LeaveRequest::class,
                    'approvable_id' => $req->id,
                    'submitted_by' => $u->id,
                    'submitted_at' => now(),
                    'decided_by' => $hr->id,
                    'decision' => $s['status'],
                    'status' => $s['status'],
                    'current_approver_role' => 'hr',
                    'decision_reason' => $s['status'] === 'approved' ? 'Approved, have fun' : 'Too many people on leave',
                    'decided_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            // Balances
            DB::table('leave_balances')->updateOrInsert(
                ['user_id' => $u->id, 'leave_type' => 'casual', 'year' => date('Y')],
                ['allowed' => 12, 'used' => rand(0, 5), 'created_at' => now(), 'updated_at' => now()]
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
        $p1 = Project::create([
            'name' => 'Escape Room 3D',
            'description' => 'New 3D escape room game for Android.',
            'status' => 'active',
            'start_date' => Carbon::now()->subMonths(2),
            'end_date' => Carbon::now()->addMonths(1),
            'department_id' => Department::where('name', 'Game Dev Team')->value('id')
        ]);

        $p2 = Project::create([
            'name' => 'Summer Camp Vlog',
            'description' => 'YouTube vlog for summer series.',
            'status' => 'active',
            'start_date' => Carbon::now()->addDays(10),
            'end_date' => Carbon::now()->addMonths(1),
            'department_id' => Department::where('name', 'YouTube Team')->value('id')
        ]);

        // Tasks
        for ($i = 1; $i <= 10; $i++) {
            $t = Task::create([
                'title' => "Level $i Design",
                'description' => "Design level $i puzzles.",
                'project_id' => $p1->id,
                'assignee_id' => $praveen->id,
                'status' => $i < 4 ? 'done' : ($i < 6 ? 'in_progress' : 'todo'),
                'priority' => 'high',
                'due_date' => Carbon::now()->addDays($i * 2),
                'reporter_id' => $praveen->id
            ]);

            // Task Comments & Activities
            if ($i === 4 || $i === 5) {
                DB::table('task_comments')->insert([
                    'task_id' => $t->id,
                    'user_id' => $rahul->id,
                    'body' => 'Looks good, I will start unity implementation soon.',
                    'created_at' => now()->subHours(5),
                    'updated_at' => now()->subHours(5)
                ]);
                DB::table('task_activity')->insert([
                    'task_id' => $t->id,
                    'user_id' => $praveen->id,
                    'event' => 'progress',
                    'metadata' => json_encode(['from' => 'todo', 'to' => 'in_progress']),
                    'created_at' => now()->subDays(1)
                ]);
            }

            // Task Time Logs
            if ($i < 4) {
                DB::table('task_time_logs')->insert([
                    'task_id' => $t->id,
                    'project_id' => $p1->id,
                    'user_id' => $praveen->id,
                    'started_at' => now()->subDays(2)->setHour(10),
                    'ended_at' => now()->subDays(2)->setHour(14),
                    'minutes_logged' => 240,
                    'description' => 'Completed design',
                    'log_date' => now()->subDays(2)->toDateString(),
                    'created_at' => now()->subDays(2),
                    'updated_at' => now()->subDays(2)
                ]);
            }
        }

        for ($i = 1; $i <= 5; $i++) {
            Task::create([
                'title' => "Shoot Location $i",
                'description' => "Shoot vlog footage at loc $i.",
                'project_id' => $p2->id,
                'assignee_id' => $ajith->id,
                'status' => 'todo',
                'priority' => 'medium',
                'due_date' => Carbon::now()->addDays($i * 3 + 10),
                'reporter_id' => $dinesh->id
            ]);
        }

        // QA Form & Submissions
        $qaForm = QaForm::create([
            'title' => 'Game Release Checklist',
            'description' => 'Standard QA for new games.',
            'created_by' => $dinesh->id
        ]);
        
        $p1->update(['qa_form_id' => $qaForm->id]);

        $field = QaFormField::create([
            'qa_form_id' => $qaForm->id,
            'label' => 'No crash on startup?',
            'field_type' => 'checkbox',
            'order' => 1
        ]);

        QaSubmission::create([
            'qa_form_id' => $qaForm->id,
            'user_id' => $rahul->id,
            'task_id' => Task::where('project_id', $p1->id)->first()->id,
            'values' => [$field->id => true],
            'note' => 'Tested on Android 13, smooth.'
        ]);
    }

    private function seedCommsAndNotifications($users)
    {
        $this->command->info("Seeding Chat & Comms...");
        $karthik = $users->where('username', 'karthik')->first();
        $praveen = $users->where('username', 'praveen')->first();
        $dinesh = $users->where('username', 'dinesh')->first();

        // 1. Announcements & Reactions
        $ann = Announcement::create([
            'title' => 'Company Annual Meet',
            'body' => 'We are hosting the annual meet next month. Be prepared!',
            'created_by' => $karthik->id
        ]);
        
        DB::table('reactions')->insert([
            'reactable_type' => Announcement::class,
            'reactable_id' => $ann->id,
            'user_id' => $praveen->id,
            'emoji' => '👍',
            'created_at' => now()
        ]);
        DB::table('reactions')->insert([
            'reactable_type' => Announcement::class,
            'reactable_id' => $ann->id,
            'user_id' => $dinesh->id,
            'emoji' => '🎉',
            'created_at' => now()
        ]);

        // 2. Cross-dept DM
        $dm = Conversation::create(['scope' => 'direct']);
        $dm->users()->attach([$praveen->id, $dinesh->id]);
        Message::create([
            'conversation_id' => $dm->id,
            'sender_id' => $praveen->id,
            'body' => 'Hey Dinesh, when is the vlog releasing? Need to coordinate marketing assets.'
        ]);
        Message::create([
            'conversation_id' => $dm->id,
            'sender_id' => $dinesh->id,
            'body' => 'We are aiming for next Friday.'
        ]);

        // 3. Group Chats
        $group = Conversation::create(['scope' => 'group', 'name' => 'General Discussion']);
        $group->users()->attach($users->pluck('id')->toArray());
        
        for ($i = 0; $i < 15; $i++) {
            $sender = $users->random();
            Message::create([
                'conversation_id' => $group->id,
                'sender_id' => $sender->id,
                'body' => "Good morning team! Random message $i."
            ]);
        }

        // 4. Notifications
        Notification::create([
            'user_id' => $praveen->id,
            'title' => 'New Task Assigned',
            'body' => 'You have been assigned to Level 10 Design.',
            'type' => 'task',
            'read_at' => null
        ]);
        Notification::create([
            'user_id' => $dinesh->id,
            'title' => 'Leave Approved',
            'body' => 'Your leave request has been approved.',
            'type' => 'leave',
            'read_at' => now()
        ]);
    }

    private function seedSystemConfig($users)
    {
        $this->command->info("Seeding Config, Logs, etc...");
        $karthik = $users->where('username', 'karthik')->first();

        // Login Attempts
        DB::table('login_attempts')->insert([
            'identifier' => 'karthik',
            'ip_address' => '127.0.0.1',
            'success' => false,
            'created_at' => now()->subHours(2)
        ]);

        // Password Resets
        DB::table('password_reset_requests')->insert([
            'user_id' => $karthik->id,
            'status' => 'pending',
            'created_at' => now()
        ]);

        // Feedback
        DB::table('feedback')->insert([
            'user_id' => $users->where('username', 'praveen')->first()->id,
            'body' => 'The task board is slightly laggy on Firefox.',
            'created_at' => now()
        ]);

        // Saved Views
        DB::table('saved_views')->insert([
            'user_id' => $karthik->id,
            'name' => 'My High Priority Tasks',
            'entity' => 'tasks',
            'config' => json_encode(['priority' => 'high', 'status' => 'todo']),
            'created_at' => now()
        ]);

        // Audit Logs (15+ entries)
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
                'at' => now()
            ]);
        }
    }
}
