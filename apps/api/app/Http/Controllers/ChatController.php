<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Events\MessageSent;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    private function checkAccess(Conversation $conversation, $user): void
    {
        if ($conversation->scope === 'global') {
            return;
        }

        $isMember = $conversation->users()->where('users.id', $user->id)->exists();
        if (!$isMember) {
            abort(403, 'Unauthorized access to conversation');
        }
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $conversations = Conversation::where(function ($query) use ($user) {
            $query->whereHas('users', function ($q) use ($user) {
                $q->where('users.id', $user->id);
            })->orWhere('scope', 'global');
        })
        ->with(['users', 'latestMessage.sender', 'project'])
        ->cursorPaginate(50);

        return response()->json($conversations);
    }

    public function messages(Request $request, $id)
    {
        $conversation = Conversation::findOrFail($id);
        $this->checkAccess($conversation, $request->user());

        $messages = Message::where('conversation_id', $conversation->id)
            ->with(['sender', 'replyTo', 'reads'])
            ->orderBy('created_at', 'asc')
            ->cursorPaginate(50);

        return response()->json($messages);
    }

    public function sendMessage(Request $request, $id)
    {
        $conversation = Conversation::findOrFail($id);
        $this->checkAccess($conversation, $request->user());

        $validated = $request->validate([
            'body' => 'nullable|string',
            'type' => 'nullable|in:text,image,file',
            'attachment_url' => 'nullable|string',
            'attachment' => 'nullable|file|max:10240',
            'reply_to_id' => 'nullable|exists:messages,id',
            'mentions' => 'nullable|array',
            'mentions.*' => 'integer|exists:users,id',
        ]);

        
        $attachmentUrl = $validated['attachment_url'] ?? null;
        $type = $validated['type'] ?? 'text';

        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('chat_attachments', 'supabase');
            $attachmentUrl = \Illuminate\Support\Facades\Storage::disk('supabase')->url($path);
            
            if (!isset($validated['type'])) {
                $mimeType = $request->file('attachment')->getMimeType();
                $type = str_starts_with($mimeType, 'image/') ? 'image' : 'file';
            }
        }

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $request->user()->id,
            'body' => $validated['body'] ?? '',
            'type' => $type,
            'attachment_url' => $attachmentUrl,
            'reply_to_id' => $validated['reply_to_id'] ?? null,
        ]);

        
        if (!empty($validated['mentions'])) {
            foreach ($validated['mentions'] as $userId) {
                if ($userId !== $request->user()->id) {
                    \App\Models\Notification::create([
                        'user_id' => $userId,
                        'type' => 'mention',
                        'title' => 'You were mentioned',
                        'body' => $request->user()->name . ' mentioned you in a message.',
                        'link' => '/dashboard/chat?conversation=' . $conversation->id,
                    ]);
                }
            }
        }

        broadcast(new MessageSent($message))->toOthers();

        return response()->json($message->load(['sender', 'replyTo']));
    }

    
    public function markRead(Request $request, $id)
    {
        $conversation = Conversation::findOrFail($id);
        $this->checkAccess($conversation, $request->user());

        $unreadMessages = Message::where('conversation_id', $conversation->id)
            ->where('sender_id', '!=', $request->user()->id)
            ->whereDoesntHave('reads', function ($q) use ($request) {
                $q->where('user_id', $request->user()->id);
            })
            ->cursorPaginate(50);

        foreach ($unreadMessages as $msg) {
            \Illuminate\Support\Facades\DB::table('conversation_message_reads')->updateOrInsert(
                ['message_id' => $msg->id, 'user_id' => $request->user()->id],
                ['read_at' => now(), 'updated_at' => now(), 'created_at' => now()]
            );
        }

        if ($conversation->scope !== 'global') {
            $conversation->users()->updateExistingPivot($request->user()->id, ['last_read_at' => now()]);
        }

        return response()->json(['success' => true]);
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
