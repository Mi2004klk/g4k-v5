<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Events\AnnouncementCreated;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $activeRole = $user->resolveActiveRole();

        $query = Announcement::with(['creator', 'team', 'reactionsList'])
            ->orderBy('pinned_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->limit(100);

        if ($activeRole !== 'super_admin') {
            $userTeams = $user->team_id ? [$user->team_id] : [];
            if ($activeRole === 'hr') {
                $managedDepts = \App\Support\HrScope::managedDepartmentIds($user);
                $managedTeams = empty($managedDepts) ? [] : \App\Models\Team::whereIn('department_id', $managedDepts)->pluck('id')->toArray();
                $userTeams = array_unique(array_merge($userTeams, $managedTeams));
            }
            
            $query->where(function($q) use ($userTeams) {
                $q->where('scope', 'company')
                  ->orWhere(function($sub) use ($userTeams) {
                      $sub->where('scope', 'team')
                          ->whereIn('team_id', $userTeams);
                  });
            });
        }

        $announcements = $query->get();

        return response()->json(['data' => $announcements]);
    }

    public function store(Request $request)
    {
        $activeRole = $request->user()->resolveActiveRole();
        if (!\App\Support\CapabilityMatrix::hasCapability($activeRole, 'announcements.manage')) {
            return response()->json(['message' => 'Unauthorized. You need announcements.manage capability.'], 403);
        }


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
            'team_id' => $validated['team_id'] ?? ($validated['scope'] === 'team' ? $request->user()->team_id : null),
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
        
        $activeRole = $request->user()->resolveActiveRole();
        $canManage = \App\Support\CapabilityMatrix::hasCapability($activeRole, 'announcements.manage');
        if ($announcement->created_by !== $request->user()->id && !$canManage) {
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

        if (isset($validated['scope']) && $validated['scope'] === 'team' && !isset($validated['team_id'])) {
            $validated['team_id'] = $request->user()->team_id;
        }

        $announcement->update($validated);
        
        \Illuminate\Support\Facades\Cache::forget("announcements_all");

        return response()->json(['data' => $announcement->load(['creator', 'team'])]);
    }

    public function destroy(Request $request, $id)
    {
        $announcement = Announcement::findOrFail($id);

        $activeRole = $request->user()->resolveActiveRole();
        $canManage = \App\Support\CapabilityMatrix::hasCapability($activeRole, 'announcements.manage');
        if ($announcement->created_by !== $request->user()->id && !$canManage) {
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
        $emoji = $validated['emoji'];

        $existingReaction = \Illuminate\Support\Facades\DB::table('reactions')
            ->where('reactable_type', Announcement::class)
            ->where('reactable_id', $announcement->id)
            ->where('user_id', $userId)
            ->where('emoji', $emoji)
            ->first();

        if ($existingReaction) {
            \Illuminate\Support\Facades\DB::table('reactions')->where('id', $existingReaction->id)->delete();
        } else {
            \Illuminate\Support\Facades\DB::table('reactions')->insert([
                'reactable_type' => Announcement::class,
                'reactable_id' => $announcement->id,
                'user_id' => $userId,
                'emoji' => $emoji,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // We also need to map this back to the JSON structure expected by the frontend for announcements
        $reactionsDb = \Illuminate\Support\Facades\DB::table('reactions')
            ->where('reactable_type', Announcement::class)
            ->where('reactable_id', $announcement->id)
            ->get();
            
        $reactionsJson = [];
        foreach ($reactionsDb as $reaction) {
            if (!isset($reactionsJson[$reaction->emoji])) {
                $reactionsJson[$reaction->emoji] = [];
            }
            $reactionsJson[$reaction->emoji][] = $reaction->user_id;
        }
        
        // Temporarily assign it to the object for the response (the model can have an accessor later)
        $announcement->reactions = $reactionsJson;

        return response()->json(['data' => $announcement->load(['creator', 'team'])]);
    }
}

