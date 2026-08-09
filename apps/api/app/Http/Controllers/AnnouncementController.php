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
}
