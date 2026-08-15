<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Events\MessageSent;
use Illuminate\Http\Request;
use App\Services\NotificationService;
use App\Services\CapabilityMatrix;
use App\Events\MessageRead;

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
        ->withCount(['messages as unread_count' => function ($query) use ($user) {
            $query->where('sender_id', '!=', $user->id)
                  ->whereDoesntHave('reads', function ($q) use ($user) {
                      $q->where('user_id', $user->id);
                  });
        }])
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
            $disk = config('filesystems.default');
            $path = $request->file('attachment')->store('chat_attachments', $disk);
            $attachmentUrl = \Illuminate\Support\Facades\Storage::disk($disk)->url($path);
            
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
                    NotificationService::send(
                        $userId,
                        'high',
                        'You were mentioned',
                        $request->user()->name . ' mentioned you in a message: "' . \Illuminate\Support\Str::limit($validated['body'] ?? '', 50) . '"',
                        ['conversation_id' => $conversation->id, 'message_id' => $message->id],
                        '/dashboard/chat?conversation=' . $conversation->id
                    );
                }
            }
        }

        try {
            broadcast(new MessageSent($message))->toOthers();
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to broadcast MessageSent event: ' . $e->getMessage());
        }

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

        if ($conversation->scope === 'direct') {
            try {
                broadcast(new MessageRead($conversation->id, $request->user()->id))->toOthers();
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Failed to broadcast MessageRead event: ' . $e->getMessage());
            }
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

        if ($user->id == $recipientId) {
            return response()->json(['message' => 'Cannot start a direct message with yourself.'], 422);
        }

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

        $conversation->load('users');
        
        try {
            broadcast(new \App\Events\ConversationCreated($conversation))->toOthers();
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to broadcast ConversationCreated event: ' . $e->getMessage());
        }

        return response()->json($conversation);
    }

    public function createGroup(Request $request)
    {
        $role = $request->user()->active_role ?? 'employee';
        if (!CapabilityMatrix::hasCapability($role, 'chat.manage') && !CapabilityMatrix::hasCapability($role, 'projects.manage')) {
            abort(403, 'Only HR or Admin can create custom groups');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'member_ids' => 'required|array',
            'member_ids.*' => 'exists:users,id',
        ]);

        $conversation = Conversation::create([
            'scope' => 'group',
            'name' => $validated['name']
        ]);

        $memberIds = array_unique(array_merge($validated['member_ids'], [$request->user()->id]));
        $conversation->users()->attach($memberIds);

        return response()->json($conversation->load('users'));
    }

    public function pinMessage(Request $request, $conversationId, $messageId)
    {
        $conversation = Conversation::findOrFail($conversationId);
        $this->checkAccess($conversation, $request->user());

        $role = $request->user()->active_role ?? 'employee';
        if (!CapabilityMatrix::hasCapability($role, 'chat.manage') && !CapabilityMatrix::hasCapability($role, 'projects.manage')) {
            abort(403, 'Only HR or Admin can pin messages');
        }

        $message = Message::where('conversation_id', $conversationId)->findOrFail($messageId);
        $message->update([
            'pinned_at' => now()
        ]);

        return response()->json($message);
    }

    public function unpinMessage(Request $request, $conversationId, $messageId)
    {
        $conversation = Conversation::findOrFail($conversationId);
        $this->checkAccess($conversation, $request->user());

        $role = $request->user()->active_role ?? 'employee';
        if (!CapabilityMatrix::hasCapability($role, 'chat.manage') && !CapabilityMatrix::hasCapability($role, 'projects.manage')) {
            abort(403, 'Only HR or Admin can unpin messages');
        }

        $message = Message::where('conversation_id', $conversationId)->findOrFail($messageId);
        $message->update([
            'pinned_at' => null
        ]);

        return response()->json($message);
    }
}
