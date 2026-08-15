<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Events\AnnouncementCreated;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index(Request $request)
    {
        $announcements = Announcement::with(['creator', 'team'])
            ->orderBy('pinned_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        return response()->json(['data' => $announcements]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'scope' => 'nullable|in:company,team',
            'team_id' => 'nullable|exists:teams,id',
            'pinned' => 'nullable|boolean',
            'priority' => 'nullable|in:normal,high,urgent',
        ]);

        $announcement = Announcement::create([
            'title' => $validated['title'],
            'body' => $validated['body'],
            'scope' => $validated['scope'] ?? 'company',
            'team_id' => $validated['team_id'] ?? null,
            'created_by' => $request->user()->id,
            'pinned_at' => !empty($validated['pinned']) ? now() : null,
            'priority' => $validated['priority'] ?? 'normal',
        ]);

        try {
            broadcast(new AnnouncementCreated($announcement))->toOthers();
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Failed to broadcast AnnouncementCreated event: " . $e->getMessage());
        }

        if (in_array($announcement->priority, ['high', 'urgent'])) {
            $userIds = [];
            if ($announcement->scope === 'department' && $announcement->team_id) {
                $userIds = \App\Models\User::where('department_id', $announcement->team_id)->where('status', 'active')->pluck('id')->toArray();
            } else {
                $userIds = \App\Models\User::where('status', 'active')->pluck('id')->toArray();
            }
            
            foreach ($userIds as $uid) {
                if ($uid === $request->user()->id) continue;
                \App\Services\NotificationService::send(
                    userId: $uid,
                    type: 'system',
                    title: "📢 New Announcement: {$announcement->title}",
                    body: \Illuminate\Support\Str::limit($announcement->body, 100),
                    data: ['announcement_id' => $announcement->id],
                    link: "/dashboard/announcements",
                    priority: $announcement->priority
                );
            }
        }
        
        \Illuminate\Support\Facades\Cache::forget("announcements_all");

        return response()->json(['data' => $announcement->load(['creator', 'team'])]);
    }

    public function update(Request $request, $id)
    {
        $announcement = Announcement::findOrFail($id);
        
        $activeRole = $request->user()->active_role ?? 'employee';
        if ($announcement->created_by !== $request->user()->id && $activeRole !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized. You can only modify your own announcements.'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'body' => 'sometimes|string',
            'scope' => 'nullable|in:company,team',
            'team_id' => 'nullable|exists:teams,id',
            'pinned' => 'nullable|boolean',
            'priority' => 'nullable|in:normal,high,urgent',
        ]);

        if (array_key_exists('pinned', $validated)) {
            $validated['pinned_at'] = $validated['pinned'] ? now() : null;
            unset($validated['pinned']);
        }

        $announcement->update($validated);
        
        \Illuminate\Support\Facades\Cache::forget("announcements_all");

        return response()->json(['data' => $announcement->load(['creator', 'team'])]);
    }

    public function destroy(Request $request, $id)
    {
        $announcement = Announcement::findOrFail($id);

        $activeRole = $request->user()->active_role ?? 'employee';
        if ($announcement->created_by !== $request->user()->id && $activeRole !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized. You can only delete your own announcements.'], 403);
        }

        $announcement->delete();
        
        \Illuminate\Support\Facades\Cache::forget("announcements_all");

        return response()->json(['message' => 'Announcement deleted successfully']);
    }

    public function react(Request $request, $id)
    {
        $validated = $request->validate([
            'emoji' => 'required|string|max:16',
        ]);

        $announcement = Announcement::findOrFail($id);
        $userId = $request->user()->id;
        $reactions = $announcement->reactions ?? [];

        $emoji = $validated['emoji'];
        if (!isset($reactions[$emoji])) {
            $reactions[$emoji] = [];
        }

        if (in_array($userId, $reactions[$emoji])) {
            // Remove reaction if already reacted
            $reactions[$emoji] = array_values(array_filter($reactions[$emoji], fn($uid) => $uid !== $userId));
            if (empty($reactions[$emoji])) {
                unset($reactions[$emoji]);
            }
        } else {
            // Add reaction
            $reactions[$emoji][] = $userId;
        }

        $announcement->update(['reactions' => $reactions]);

        return response()->json(['data' => $announcement->fresh()->load(['creator', 'team'])]);
    }
}
