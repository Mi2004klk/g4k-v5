<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use App\Models\Conversation;
use App\Models\User;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tag orphaned demo data that lacked the is_demo flag in older seeders
        DB::table('projects')
            ->whereIn('name', ['Escape Room 3D', 'Summer Camp Vlog'])
            ->update(['is_demo' => true]);

        DB::table('qa_forms')
            ->where('title', 'Game Release Checklist')
            ->update(['is_demo' => true]);

        DB::table('announcements')
            ->where('title', 'Company Annual Meet')
            ->update(['is_demo' => true]);
            
        DB::table('conversations')
            ->where('name', 'General Discussion')
            ->where('scope', 'group')
            ->update(['is_demo' => true]);

        // 2. Ensure Global Chat exists and has all users
        $global = Conversation::where('scope', 'global')->first();
        if (!$global) {
            $global = Conversation::create([
                'scope' => 'global',
                'name' => 'Global Chat',
                'is_demo' => false
            ]);
        }

        // Ensure all active users are in the global chat
        $userIds = User::where('status', 'active')->pluck('id')->toArray();
        if (!empty($userIds)) {
            $global->users()->syncWithoutDetaching($userIds);
        }
    }

    public function down(): void
    {
        // One-way data fix
    }
};
