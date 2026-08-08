<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnnouncementController extends Controller
{
    public function index()
    {
        $announcements = DB::table('announcements')
            ->join('users', 'users.id', '=', 'announcements.author_id')
            ->select('announcements.*', 'users.name as author_name')
            ->orderBy('is_pinned', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json(['data' => $announcements]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'body' => 'required|string',
            'is_pinned' => 'boolean'
        ]);

        $id = DB::table('announcements')->insertGetId([
            'author_id' => $request->user()->id,
            'title' => $validated['title'],
            'body' => $validated['body'],
            'is_pinned' => $validated['is_pinned'] ?? false,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json(['data' => DB::table('announcements')->where('id', $id)->first()], 201);
    }
}
