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

        return response()->json($note);
    }

    public function destroy(Request $request, $id)
    {
        $note = QuickNote::where('user_id', $request->user()->id)->findOrFail($id);
        $note->delete();
        return response()->json(['message' => 'Note deleted']);
    }
}
