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
            ->whereDoesntHave('dismissals', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->orderBy('pinned_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->limit(100);

        if ($activeRole !== 'super_admin') {
            $query->where(function($q) use ($user) {
                $q->where('scope', 'company')
                  ->orWhere('priority', 'urgent')
                  ->orWhere(function($sub) use ($user) {
                      $sub->where('scope', 'team');
                      $sub->where(function($teamQ) use ($user) {
                          if ($user->team_id) {
                              $teamQ->where('team_id', $user->team_id);
                          }
                          
                          $teamQ->orWhere(function($hrQ) use ($user) {
                              // We only want this clause to add the HR subquery if they are HR,
                              // but HrScope applies its own checks. However, if they aren't HR, 
                              // HrScope does nothing and we get an empty orWhere() which might be problematic,
                              // or it might select all.
                              // So we explicitly check:
                              if ($user->resolveActiveRole() === 'hr') {
                                  \App\Support\HrScope::apply($hrQ, $user, 'team_id');
                              } else {
                                  // ensure it evaluates to false if not HR so it doesn't match everything
                                  $hrQ->whereRaw('1 = 0');
                              }
                          });
                      });
                  });
            });
        }

        $announcements = $query->get();

        return response()->json(['data' => $announcements]);
    }

    public function store(Request $request)
    {
        $activeRole = $request->user()->resolveActiveRole();
        if (!\App\Services\CapabilityMatrix::hasCapability($activeRole, 'announcements.manage')) {
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

        $scope = $validated['scope'] ?? 'company';
        $teamId = $validated['team_id'] ?? ($scope === 'team' ? $request->user()->team_id : null);

        if ($scope === 'team' && !$teamId) {
            return response()->json(['message' => 'Team ID is required for team announcements.'], 422);
        }

        if ($activeRole === 'hr') {
            if ($scope === 'company') {
                return response()->json(['message' => 'HR cannot post company-wide announcements.'], 403);
            }
            if ($scope === 'team' && $teamId) {
                $team = \App\Models\Team::find($teamId);
                $deptIds = \App\Support\HrScope::managedDepartmentIds($request->user());
                if (!$team || !in_array($team->department_id, $deptIds)) {
                    return response()->json(['message' => 'Unauthorized. You do not manage the department this team belongs to.'], 403);
                }
            }
        }
        $attachmentUrl = null;
        if ($request->hasFile('attachment')) {
            $disk = config('filesystems.default');
            $path = $request->file('attachment')->store('announcements', $disk);
            $attachmentUrl = \Illuminate\Support\Facades\Storage::disk($disk)->url($path);
        }

        $announcement = Announcement::create([
            'title' => $validated['title'],
            'body' => $validated['body'],
            'scope' => $scope,
            'team_id' => $teamId,
            'created_by' => $request->user()->id,
            'pinned_at' => !empty($validated['pinned']) ? now() : null,
            'priority' => $validated['priority'] ?? 'normal',
            'attachment_url' => $attachmentUrl,
        ]);

        try {
            try {
                broadcast(new AnnouncementCreated($announcement))->toOthers();
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error("Inner broadcast error: " . $e->getMessage());
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Failed to broadcast AnnouncementCreated event: " . $e->getMessage());
        }

        if (in_array($announcement->priority, ['high', 'urgent'])) {
            $userIds = [];
            if ($announcement->priority === 'urgent') {
                $userIds = \App\Models\User::where('status', 'active')->pluck('id')->toArray();
            } elseif ($announcement->scope === 'team' && $announcement->team_id) {
                $userIds = \App\Models\User::where('team_id', $announcement->team_id)->where('status', 'active')->pluck('id')->toArray();
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
        
        $activeRole = $request->user()->resolveActiveRole();
        \Illuminate\Support\Facades\Cache::forget("announcements_{$request->user()->id}_{$activeRole}");

        return response()->json(['data' => $announcement->load(['creator', 'team'])]);
    }

    public function update(Request $request, $id)
    {
        $announcement = Announcement::findOrFail($id);
        
        $activeRole = $request->user()->resolveActiveRole();
        $canManage = \App\Services\CapabilityMatrix::hasCapability($activeRole, 'announcements.manage');
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

        $newScope = $validated['scope'] ?? $announcement->scope;
        $newTeamId = $validated['team_id'] ?? ($newScope === 'team' ? $announcement->team_id : null);

        if ($activeRole === 'hr') {
            if ($newScope === 'company') {
                return response()->json(['message' => 'HR cannot post company-wide announcements.'], 403);
            }
            if ($newScope === 'team' && $newTeamId) {
                $team = \App\Models\Team::find($newTeamId);
                $deptIds = \App\Support\HrScope::managedDepartmentIds($request->user());
                if (!$team || !in_array($team->department_id, $deptIds)) {
                    return response()->json(['message' => 'Unauthorized. You do not manage the department this team belongs to.'], 403);
                }
            }
        }

        $announcement->update($validated);
        
        $activeRole = $request->user()->resolveActiveRole();
        \Illuminate\Support\Facades\Cache::forget("announcements_{$request->user()->id}_{$activeRole}");

        return response()->json(['data' => $announcement->load(['creator', 'team'])]);
    }

    public function destroy(Request $request, $id)
    {
        $announcement = Announcement::findOrFail($id);

        $activeRole = $request->user()->resolveActiveRole();
        $canManage = \App\Services\CapabilityMatrix::hasCapability($activeRole, 'announcements.manage');
        if ($announcement->created_by !== $request->user()->id && !$canManage) {
            return response()->json(['message' => 'Unauthorized. You can only delete your own announcements.'], 403);
        }

        $announcement->delete();
        
        \Illuminate\Support\Facades\Cache::forget("announcements_{$request->user()->id}_{$activeRole}");

        return response()->json(['message' => 'Announcement deleted successfully']);
    }

    public function react(Request $request, $id)
    {
        $validated = $request->validate([
            'emoji' => 'required|string|max:16',
        ]);

        $user = $request->user();
        $activeRole = $user->resolveActiveRole();
        
        $query = Announcement::where('id', $id);
        if ($activeRole !== 'super_admin') {
            $query->where(function($q) use ($user) {
                $q->where('scope', 'company')
                  ->orWhere('priority', 'urgent')
                  ->orWhere(function($sub) use ($user) {
                      $sub->where('scope', 'team');
                      $sub->where(function($teamQ) use ($user) {
                          if ($user->team_id) {
                              $teamQ->where('team_id', $user->team_id);
                          }
                          $teamQ->orWhere(function($hrQ) use ($user) {
                              if ($user->resolveActiveRole() === 'hr') {
                                  \App\Support\HrScope::apply($hrQ, $user, 'team_id');
                              } else {
                                  $hrQ->whereRaw('1 = 0');
                              }
                          });
                      });
                  });
            });
        }
        $announcement = $query->firstOrFail();
        $userId = $request->user()->id;
        $emoji = $validated['emoji'];
        
        $emojiMap = [
            'like' => '👍',
            'heart' => '❤️',
            'party' => '🎉',
            'laugh' => '😂',
            'sad' => '😢',
        ];
        if (array_key_exists($emoji, $emojiMap)) {
            $emoji = $emojiMap[$emoji];
        }

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
        
        $announcement->reactions = $reactionsJson;

        \Illuminate\Support\Facades\Cache::forget("announcements_{$request->user()->id}_{$activeRole}");
        try {
            broadcast(new \App\Events\AnnouncementCreated($announcement));
        } catch (\Throwable $e) {}

        return response()->json(['data' => $announcement->load(['creator', 'team'])]);
    }

    public function dismiss(Request $request, $id)
    {
        $user = $request->user();
        $announcement = Announcement::findOrFail($id);
        
        $announcement->dismissals()->syncWithoutDetaching([$user->id]);

        return response()->json(['message' => 'Announcement dismissed successfully']);
    }
}
