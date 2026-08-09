<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Events\MessageSent;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $conversations = Conversation::whereHas('users', function ($q) use ($user) {
            $q->where('users.id', $user->id);
        })->orWhere('scope', 'global')
        ->with(['users', 'latestMessage.sender', 'project'])
        ->get();

        return response()->json($conversations);
    }

    public function messages(Request $request, $id)
    {
        $conversation = Conversation::findOrFail($id);
        $messages = Message::where('conversation_id', $conversation->id)
            ->with(['sender', 'replyTo'])
            ->orderBy('created_at', 'asc')
            ->cursorPaginate(50);

        return response()->json($messages);
    }

    public function sendMessage(Request $request, $id)
    {
        $conversation = Conversation::findOrFail($id);

        $validated = $request->validate([
            'body' => 'nullable|string',
            'type' => 'nullable|in:text,image,file',
            'attachment_url' => 'nullable|string',
            'reply_to_id' => 'nullable|exists:messages,id',
        ]);

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $request->user()->id,
            'body' => $validated['body'] ?? '',
            'type' => $validated['type'] ?? 'text',
            'attachment_url' => $validated['attachment_url'] ?? null,
            'reply_to_id' => $validated['reply_to_id'] ?? null,
        ]);

        broadcast(new MessageSent($message))->toOthers();

        return response()->json($message->load(['sender', 'replyTo']));
    }

    public function startDirectMessage(Request $request)
    {
        $validated = $request->validate([
            'recipient_id' => 'required|exists:users,id',
        ]);

        $user = $request->user();
        $recipientId = $validated['recipient_id'];

        $existing = Conversation::where('scope', 'direct')
            ->whereHas('users', function ($q) use ($user) {
                $q->where('users.id', $user->id);
            })
            ->whereHas('users', function ($q) use ($recipientId) {
                $q->where('users.id', $recipientId);
            })
            ->first();

        if ($existing) {
            return response()->json($existing->load('users'));
        }

        $conversation = Conversation::create(['scope' => 'direct']);
        $conversation->users()->attach([$user->id, $recipientId]);

        return response()->json($conversation->load('users'));
    }
}
