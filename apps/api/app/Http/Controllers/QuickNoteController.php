<?php

namespace App\Http\Controllers;

use App\Models\QuickNote;
use Illuminate\Http\Request;

class QuickNoteController extends Controller
{
    public function index(Request $request)
    {
        $notes = QuickNote::where('user_id', $request->user()->id)
            ->orderBy('pinned', 'desc')
            ->orderBy('updated_at', 'desc')
            ->limit(100)
            ->get();

        return response()->json(['data' => $notes]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'body' => 'required|string',
            'pinned' => 'nullable|boolean',
        ]);

        $note = QuickNote::create([
            'user_id' => $request->user()->id,
            'body' => $validated['body'],
            'pinned' => $validated['pinned'] ?? false,
        ]);

        $user = $request->user();
        \Illuminate\Support\Facades\Cache::forget(\App\Services\DashboardCacheService::getQuickNotesKey($user->id));

        return response()->json(['data' => $note]);
    }

    public function update(Request $request, $id)
    {
        $note = QuickNote::where('user_id', $request->user()->id)->findOrFail($id);

        $validated = $request->validate([
            'body' => 'sometimes|string',
            'pinned' => 'sometimes|boolean',
        ]);

        $note->update($validated);

        $user = $request->user();
        \Illuminate\Support\Facades\Cache::forget(\App\Services\DashboardCacheService::getQuickNotesKey($user->id));

        return response()->json(['data' => $note]);
    }

    public function destroy(Request $request, $id)
    {
        $note = QuickNote::where('user_id', $request->user()->id)->findOrFail($id);
        $note->delete();
        $user = $request->user();
        \Illuminate\Support\Facades\Cache::forget(\App\Services\DashboardCacheService::getQuickNotesKey($user->id));

        return response()->json(['message' => 'Note deleted']);
    }
}

