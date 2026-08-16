<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Project;
use App\Models\Task;
use App\Models\Conversation;
use App\Models\Message;
use Carbon\Carbon;

class V5DemoSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();
        if ($users->isEmpty()) {
            return;
        }

        $hrAdmin = User::whereHas('roleAssignments', function($q){
            $q->where('role', 'hr')->orWhere('role', 'super_admin');
        })->first() ?? $users->first();

        // 1. Projects and Tasks (Approval Pipeline Scenarios - V5-025)
        $project = Project::firstOrCreate(
            ['name' => 'V5 Demo Project'],
            [
                'description' => 'A project to test the approval pipeline and QA forms', 
                'status' => 'active',
                'priority' => 'high'
            ]
        );
        $project->members()->sync($users->pluck('id'));

        $scenarios = [
            ['title' => 'Pending Approval Task', 'status' => 'review', 'progress' => 100],
            ['title' => 'Rejected/Redo Task', 'status' => 'in_progress', 'progress' => 50],
            ['title' => 'Approved Task', 'status' => 'done', 'progress' => 100]
        ];

        foreach ($scenarios as $s) {
            $assignee = $users->random();
            $task = Task::create([
                'title' => $s['title'],
                'description' => 'Demo task',
                'project_id' => $project->id,
                'status' => $s['status'],
                'progress' => $s['progress'],
                'assignee_id' => $assignee->id
            ]);

            // Sync pivot for assignee
            $task->assignees()->sync([$assignee->id]);

            // If pending approval, simulate submission
            if ($s['status'] === 'review') {
                DB::table('task_activity')->insert([
                    'task_id' => $task->id,
                    'user_id' => $task->assignee_id,
                    'event' => 'submitted',
                    'metadata' => json_encode(['from' => 'in_progress', 'to' => 'review']),
                    'created_at' => now()
                ]);
            }
            if ($s['status'] === 'in_progress' && str_contains($s['title'], 'Redo')) {
                 DB::table('task_comments')->insert([
                    'task_id' => $task->id,
                    'user_id' => $hrAdmin->id,
                    'body' => 'Needs rework on UI components.',
                    'created_at' => now(), 'updated_at' => now()
                 ]);
            }
        }

        // 2. Chat Scenarios (V5-026)
        // Multi-participant chat
        $groupConv = Conversation::firstOrCreate([
            'name' => 'Frontend Developers Sync',
            'scope' => 'group'
        ]);
        $groupConv->users()->syncWithoutDetaching($users->take(4)->pluck('id'));
        
        // Add messages
        for ($i=0; $i<5; $i++) {
            Message::create([
                'conversation_id' => $groupConv->id,
                'sender_id' => $users->take(4)->random()->id,
                'body' => 'This is a message ' . $i,
                'created_at' => now()->subMinutes(10 - $i),
                'updated_at' => now()->subMinutes(10 - $i),
            ]);
        }

        // Direct message
        $user1 = $users[0];
        $user2 = $users[1];
        if ($user1 && $user2) {
            $dmConv = Conversation::create(['scope' => 'direct']);
            $dmConv->users()->attach([$user1->id, $user2->id]);
            Message::create([
                'conversation_id' => $dmConv->id,
                'sender_id' => $user1->id,
                'body' => 'Hello there!',
                'created_at' => now(), 'updated_at' => now()
            ]);
        }

        // 3 & 4. 60-day Attendance & Anomalies (V5-027, V5-028)
        $schedule = DB::table('work_schedules')->first();
        if ($schedule) {
            foreach ($users as $u) {
                for ($i = 0; $i < 60; $i++) {
                    $date = Carbon::now()->subDays($i);
                    // Skip weekends if schedule requires
                    $workingDays = json_decode($schedule->working_days, true);
                    if (!in_array($date->dayOfWeekIso, $workingDays)) continue;

                    // Random status
                    $rand = rand(1, 100);
                    if ($rand <= 70) {
                        $status = 'present';
                        $start = $date->copy()->setTimeFromTimeString($schedule->start_time)->subMinutes(rand(0, 15));
                        $end = $date->copy()->setTimeFromTimeString($schedule->end_time)->addMinutes(rand(0, 30));
                    } elseif ($rand <= 85) {
                        $status = 'late';
                        $start = $date->copy()->setTimeFromTimeString($schedule->start_time)->addMinutes(rand(30, 90));
                        $end = $date->copy()->setTimeFromTimeString($schedule->end_time)->addMinutes(rand(0, 30));
                    } elseif ($rand <= 95) {
                        $status = 'absent';
                        $start = null;
                        $end = null;
                    } else {
                        $status = 'absent';
                        $start = null;
                        $end = null;
                    }

                    if ($status !== 'absent') {
                        DB::table('attendance_days')->updateOrInsert(
                            ['user_id' => $u->id, 'date' => $date->toDateString()],
                            [
                                'status' => $status,
                                'clock_in' => $start,
                                'clock_out' => $end,
                                'total_seconds' => $start && $end ? abs($end->diffInSeconds($start)) : 0,
                                'created_at' => now(),
                                'updated_at' => now()
                            ]
                        );
                    } else {
                        DB::table('attendance_days')->updateOrInsert(
                            ['user_id' => $u->id, 'date' => $date->toDateString()],
                            [
                                'status' => 'absent',
                                'clock_in' => null,
                                'clock_out' => null,
                                'total_seconds' => 0,
                                'created_at' => now(),
                                'updated_at' => now()
                            ]
                        );
                    }
                }
            }
        }

        // 5. System Logs Generation (V5-029)
        for ($i=0; $i<20; $i++) {
            DB::table('audit_logs')->insert([
                'user_id' => $users->random()->id,
                'action' => 'login',
                'subject_type' => 'auth',
                'subject_id' => null,
                'ip' => '192.168.1.' . rand(1, 255),
                'meta' => json_encode(['browser' => 'Chrome']),
                'at' => now()->subHours(rand(1, 48))
            ]);
        }
    }
}
