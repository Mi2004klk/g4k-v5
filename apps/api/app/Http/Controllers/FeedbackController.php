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

        $user = $request->user();

        // Send high-priority notification and DM to managing HR (fallback to all HR/Admin)
        $hrUsers = collect();
        if ($user->department_id) {
            $hrUsers = User::whereHas('managedDepartments', function ($q) use ($user) {
                $q->where('departments.id', $user->department_id);
            })->get();
        }
        
        if ($hrUsers->isEmpty()) {
            $hrUsers = User::whereHas('roleAssignments', function ($q) {
                $q->whereIn('role', ['hr', 'super_admin']);
            })->get();
        }

        foreach ($hrUsers as $hr) {
            $conversation = \App\Models\Conversation::where('scope', 'direct')
                ->whereHas('users', fn($q) => $q->where('users.id', $user->id))
                ->whereHas('users', fn($q) => $q->where('users.id', $hr->id))
                ->first();

            if (!$conversation) {
                $conversation = \App\Models\Conversation::create(['scope' => 'direct']);
                $conversation->users()->attach([$user->id, $hr->id]);
            }

            $msg = \App\Models\Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $user->id,
                'body' => "**" . ucfirst($validated['category']) . "**: {$validated['subject']}\n\n{$validated['body']}"
            ]);

            try {
                try {
                    broadcast(new \App\Events\MessageSent($msg))->toOthers();
                } catch (\Throwable $e) {
            report($e);
        }
            } catch (\Exception $e) {
                // Ignore broadcast errors
            }

            NotificationService::send(
                userId: $hr->id,
                type: 'feedback',
                title: 'New Feedback / Complaint Submitted',
                body: "User {$user->name} submitted feedback: " . \Illuminate\Support\Str::limit($validated['body'], 100),
                data: ['feedback_id' => $feedback->id],
                link: "/dashboard/chat?conversation={$conversation->id}",
                priority: 'high'
            );
        }

        return response()->json([
            'feedback' => $feedback,
            'conversation_id' => $conversation->id ?? null
        ]);
    }
}
