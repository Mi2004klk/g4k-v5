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

        return response()->json($announcements);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'scope' => 'nullable|in:company,team',
            'team_id' => 'nullable|exists:teams,id',
            'pinned' => 'nullable|boolean',
        ]);

        $announcement = Announcement::create([
            'title' => $validated['title'],
            'body' => $validated['body'],
            'scope' => $validated['scope'] ?? 'company',
            'team_id' => $validated['team_id'] ?? null,
            'created_by' => $request->user()->id,
            'pinned_at' => !empty($validated['pinned']) ? now() : null,
        ]);

        broadcast(new AnnouncementCreated($announcement))->toOthers();

        return response()->json($announcement->load(['creator', 'team']));
    }

    public function update(Request $request, $id)
    {
        $announcement = Announcement::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'body' => 'sometimes|string',
            'scope' => 'nullable|in:company,team',
            'team_id' => 'nullable|exists:teams,id',
            'pinned' => 'nullable|boolean',
        ]);

        if (array_key_exists('pinned', $validated)) {
            $validated['pinned_at'] = $validated['pinned'] ? now() : null;
            unset($validated['pinned']);
        }

        $announcement->update($validated);

        return response()->json($announcement->load(['creator', 'team']));
    }

    public function destroy($id)
    {
        $announcement = Announcement::findOrFail($id);
        $announcement->delete();

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

        return response()->json($announcement->fresh()->load(['creator', 'team']));
    }
}
