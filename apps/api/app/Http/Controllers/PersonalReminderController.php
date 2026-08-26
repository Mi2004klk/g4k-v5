<?php

namespace App\Http\Controllers;

use App\Models\PersonalReminder;
use Illuminate\Http\Request;
use Carbon\Carbon;

class PersonalReminderController extends Controller
{
    public function index(Request $request)
    {
        $reminders = PersonalReminder::where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->orderBy('remind_at', 'asc')
            ->get();
            
        return response()->json($reminders);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'nullable|string',
            'link' => 'nullable|string',
            'remind_at' => 'required|date|after:now',
        ]);

        $reminder = PersonalReminder::create([
            'user_id' => $request->user()->id,
            'title' => $validated['title'],
            'body' => $validated['body'],
            'link' => $validated['link'],
            'remind_at' => Carbon::parse($validated['remind_at']),
        ]);

        return response()->json($reminder, 201);
    }

    public function destroy(Request $request, $id)
    {
        $reminder = PersonalReminder::where('user_id', $request->user()->id)->findOrFail($id);
        $reminder->delete();
        
        return response()->json(['message' => 'Reminder deleted successfully']);
    }
}
