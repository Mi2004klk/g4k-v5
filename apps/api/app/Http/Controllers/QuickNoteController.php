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

        return response()->json($notes);
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
        $activeRole = str_replace('role:', '', $user->currentAccessToken()->abilities[0] ?? 'employee');
        $today = \Carbon\Carbon::now()->toDateString();
        \Illuminate\Support\Facades\Cache::forget("dashboard_init_{$user->id}_{$activeRole}_{$today}");
        \Illuminate\Support\Facades\Cache::forget("quick_notes_{$user->id}");

        return response()->json($note);
    }

    public function destroy(Request $request, $id)
    {
        $note = QuickNote::where('user_id', $request->user()->id)->findOrFail($id);
        $note->delete();
        $user = $request->user();
        $activeRole = str_replace('role:', '', $user->currentAccessToken()->abilities[0] ?? 'employee');
        $today = \Carbon\Carbon::now()->toDateString();
        \Illuminate\Support\Facades\Cache::forget("dashboard_init_{$user->id}_{$activeRole}_{$today}");
        \Illuminate\Support\Facades\Cache::forget("quick_notes_{$user->id}");

        return response()->json(['message' => 'Note deleted']);
    }
}
