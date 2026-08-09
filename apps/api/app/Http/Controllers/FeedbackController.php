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
            'body' => 'required|string',
        ]);

        $feedback = Feedback::create([
            'user_id' => $request->user()->id,
            'body' => $validated['body'],
        ]);

        // Send high-priority notification to HR / Admin
        $hrUsers = User::whereHas('roleAssignments', function ($q) {
            $q->whereIn('role', ['hr', 'super_admin']);
        })->get();

        foreach ($hrUsers as $hr) {
            NotificationService::send(
                $hr->id,
                'feedback',
                'New Feedback / Complaint Submitted',
                "User {$request->user()->name} submitted feedback: {$validated['body']}",
                '/dashboard/org/feedback'
            );
        }

        return response()->json($feedback);
    }
}
