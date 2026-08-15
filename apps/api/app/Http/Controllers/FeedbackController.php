<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use App\Services\NotificationService;
use App\Models\User;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'category' => 'required|in:suggestion,complaint',
            'body' => 'required|string',
        ]);

        $feedback = Feedback::create([
            'user_id' => $request->user()->id,
            'subject' => $validated['subject'],
            'category' => $validated['category'],
            'body' => $validated['body'],
        ]);

        // Send high-priority notification to HR / Admin
        $hrUsers = User::whereHas('roleAssignments', function ($q) {
            $q->whereIn('role', ['hr', 'super_admin']);
        })->get();

        foreach ($hrUsers as $hr) {
            NotificationService::send(
                userId: $hr->id,
                type: 'feedback',
                title: 'New Feedback / Complaint Submitted',
                body: "User {$request->user()->name} submitted feedback: " . \Illuminate\Support\Str::limit($validated['body'], 100),
                data: ['feedback_id' => $feedback->id],
                link: '/dashboard/org/feedback',
                priority: 'high'
            );
        }

        return response()->json($feedback);
    }
}
