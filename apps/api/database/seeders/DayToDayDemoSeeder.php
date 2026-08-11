<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Announcement;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Project;
use App\Models\Task;
use App\Models\QuickNote;
use App\Models\Feedback;
use Illuminate\Support\Facades\DB;

class DayToDayDemoSeeder extends Seeder
{
    public function run(): void
    {
        $founder = User::where('username', 'founder')->first() ?? User::first();
        $praveen = User::where('username', 'praveen')->first() ?? User::first();
        $rahul = User::where('username', 'rahul')->first() ?? User::first();

        if (!$founder) {
            return;
        }

        // 1. Announcements (1 pinned, 1 standard)
        Announcement::create([
            'title' => 'Welcome to Games4Kings Workplace OS!',
            'body' => 'We are excited to launch our unified internal portal. Please complete your profile preferences.',
            'scope' => 'company',
            'created_by' => $founder->id,
            'pinned_at' => now(),
        ]);

        Announcement::create([
            'title' => 'Q3 All-Hands Meeting',
            'body' => 'Join us this Friday at 4 PM IST for our quarterly product update and town hall.',
            'scope' => 'company',
            'created_by' => $founder->id,
            'pinned_at' => null,
        ]);

        // 2. Global / General Conversation + Messages
        $convId = DB::table('conversations')->insertGetId([
            'scope' => 'global',
            'name' => 'General Chat',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('conversation_user')->insert([
            ['conversation_id' => $convId, 'user_id' => $founder->id, 'last_read_at' => now(), 'created_at' => now(), 'updated_at' => now()],
            ['conversation_id' => $convId, 'user_id' => $praveen->id, 'last_read_at' => now(), 'created_at' => now(), 'updated_at' => now()],
        ]);

        Message::create([
            'conversation_id' => $convId,
            'sender_id' => $founder->id,
            'body' => 'Hello everyone! Welcome to the general channel.',
        ]);

        Message::create([
            'conversation_id' => $convId,
            'sender_id' => $praveen->id,
            'body' => 'Thanks Founder! Excited to be using the new portal.',
        ]);

        // 3. Project + 3 Tasks (Kanban states)
        $project = Project::create([
            'name' => 'Workplace Portal Gen2',
            'description' => 'Gen2k Conglomerate internal portal optimization',
            'status' => 'active',
            'created_by' => $founder->id,
            'start_date' => now()->subDays(10),
            'end_date' => now()->addDays(30),
        ]);

        Task::create([
            'project_id' => $project->id,
            'title' => 'Set up initial dashboard metrics',
            'description' => 'Configure caching and metric endpoints for super admin role.',
            'status' => 'done',
            'priority' => 'high',
            'assignee_id' => $praveen->id,
            'reporter_id' => $founder->id,
        ]);

        Task::create([
            'project_id' => $project->id,
            'title' => 'Review directory visibility controls',
            'description' => 'Ensure user profile visibility preferences match security guidelines.',
            'status' => 'in_progress',
            'priority' => 'medium',
            'assignee_id' => $praveen->id,
            'reporter_id' => $founder->id,
        ]);

        Task::create([
            'project_id' => $project->id,
            'title' => 'Implement timesheet submission approval',
            'description' => 'Submit completed timesheets for manager review.',
            'status' => 'review',
            'priority' => 'high',
            'assignee_id' => $praveen->id,
            'reporter_id' => $founder->id,
        ]);

        // 4. Quick Note
        QuickNote::create([
            'user_id' => $founder->id,
            'body' => 'Remember to check Q3 OKR deliverables before Friday.',
            'pinned' => true,
        ]);

        // 5. Feedback
        Feedback::create([
            'user_id' => $praveen->id,
            'body' => 'The dark mode theme toggle works great! Would love quick links on the sidebar.',
        ]);
    }
}
