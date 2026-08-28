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
    public function unreadCount(Request $request)
    {
        $user = $request->user();
        
        $count = Message::select('messages.id')
            ->leftJoin('conversation_user', function($join) use ($user) {
                $join->on('messages.conversation_id', '=', 'conversation_user.conversation_id')
                     ->where('conversation_user.user_id', '=', $user->id);
            })
            ->join('conversations', 'messages.conversation_id', '=', 'conversations.id')
            ->where('messages.sender_id', '!=', $user->id)
            ->where(function($q) use ($user) {
                $q->where(function($q2) {
                    $q2->where('conversations.scope', '!=', 'global')
                       ->whereNotNull('conversation_user.conversation_id')
                       ->where(function($q3) {
                           $q3->whereNull('conversation_user.last_read_at')
                              ->orWhereColumn('messages.created_at', '>', 'conversation_user.last_read_at');
                       })
                       ->where(function($q3) {
                           $q3->whereNull('conversation_user.cleared_at')
                              ->orWhereColumn('messages.created_at', '>', 'conversation_user.cleared_at');
                       });
                })
                ->orWhere(function($q2) use ($user) {
                    $q2->where('conversations.scope', 'global')
                       ->where('messages.created_at', '>=', $user->created_at)
                       ->whereDoesntHave('reads', function ($r) use ($user) {
                           $r->where('user_id', $user->id);
                       });
                });
            })
            ->count();

        return response()->json(['count' => $count]);
    }

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

    public function searchUsers(Request $request)
    {
        $search = $request->input('search');
        $users = \App\Models\User::where('id', '!=', $request->user()->id)
            ->where('status', 'active')
            ->when($search, function ($q) use ($search) {
                $q->where(function($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                          ->orWhere('email', 'like', "%{$search}%")
                          ->orWhere('employee_id', 'like', "%{$search}%")
                          ->orWhereHas('department', function($q2) use ($search) {
                              $q2->where('name', 'like', "%{$search}%");
                          });
                });
            })
            ->with('department:id,name')
            ->select('id', 'name', 'avatar_url', 'department_id', 'email', 'employee_id')
            ->limit(20)
            ->get();
            
        return response()->json($users);
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $search = $request->input('search');

        $conversations = Conversation::where(function ($query) use ($user) {
            $query->whereHas('users', function ($q) use ($user) {
                $q->where('users.id', $user->id);
            })->orWhere('scope', 'global');
        })
        ->when($search, function($q) use ($search) {
            $q->where(function($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhereHas('users', function($q2) use ($search) {
                          $q2->where('name', 'like', "%{$search}%");
                      });
            });
        })
        ->with(['users', 'latestMessage.sender', 'project'])
        ->withCount(['messages as unread_count' => function ($query) use ($user) {
            $query->where('messages.sender_id', '!=', $user->id)
                  ->leftJoin('conversation_user', function($join) use ($user) {
                      $join->on('messages.conversation_id', '=', 'conversation_user.conversation_id')
                           ->where('conversation_user.user_id', '=', $user->id);
                  })
                  ->where(function($q) use ($user) {
                      $q->where(function($q2) {
                          $q2->where('conversations.scope', '!=', 'global')
                             ->where(function($q3) {
                                 $q3->whereNull('conversation_user.last_read_at')
                                    ->orWhereColumn('messages.created_at', '>', 'conversation_user.last_read_at');
                             })
                             ->where(function($q3) {
                                 $q3->whereNull('conversation_user.cleared_at')
                                    ->orWhereColumn('messages.created_at', '>', 'conversation_user.cleared_at');
                             });
                      })
                      ->orWhere(function($q2) use ($user) {
                          $q2->where('conversations.scope', 'global')
                             ->where('messages.created_at', '>=', $user->created_at)
                             ->whereDoesntHave('reads', function ($r) use ($user) {
                                 $r->where('user_id', $user->id);
                             });
                      });
                  });
        }])
        ->orderByDesc('updated_at')
        ->cursorPaginate(50);

        return response()->json($conversations);
    }

    public function messages(Request $request, $id)
    {
        $conversation = Conversation::findOrFail($id);
        $this->checkAccess($conversation, $request->user());

        $pivot = $conversation->users()->where('users.id', $request->user()->id)->first()?->pivot;
        $clearedAt = $pivot?->cleared_at;

        $messages = Message::where('conversation_id', $conversation->id)
            ->when($clearedAt, function ($q) use ($clearedAt) {
                $q->where('created_at', '>', $clearedAt);
            })
            ->with(['sender', 'replyTo', 'reads'])
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->cursorPaginate(50);

        return response()->json($messages);
    }

    public function sendMessage(Request $request, $id)
    {
        $conversation = Conversation::findOrFail($id);
        $this->checkAccess($conversation, $request->user());
        
        if ($conversation->scope === 'direct') {
            $otherUser = $conversation->users()->where('users.id', '!=', $request->user()->id)->first();
            if ($otherUser && $otherUser->status !== 'active') {
                return response()->json(['message' => 'Cannot send messages to deactivated users.'], 403);
            }
        }

        $validated = $request->validate([
            'body' => 'required_without_all:attachment,attachment_url|nullable|string',
            'type' => 'nullable|in:text,image,file',
            'attachment_url' => 'nullable|url:http,https|max:2048',
            'attachment' => 'nullable|file|mimes:jpeg,png,jpg,webp,pdf,doc,docx,xls,xlsx,csv,txt,zip,rar|max:10240',
            'reply_to_id' => 'nullable|exists:messages,id',
            'mentions' => 'nullable|array',
            'mentions.*' => 'integer|exists:users,id',
        ]);

        
        $attachmentUrl = $validated['attachment_url'] ?? null;
        $type = $validated['type'] ?? 'text';

        if ($request->hasFile('attachment')) {
            $disk = config('filesystems.default');
            $path = $request->file('attachment')->store("chat_attachments/{$request->user()->id}", $disk);
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
            if ($conversation->scope === 'global') {
                $validMembers = \App\Models\User::where('status', 'active')->pluck('id')->toArray();
            } else {
                $validMembers = $conversation->users()->pluck('users.id')->toArray();
            }
            $mentions = array_intersect($validated['mentions'], $validMembers);
            foreach ($mentions as $userId) {
                if ($userId !== $request->user()->id) {
                    NotificationService::send(
                        $userId,
                        'chat',
                        'You were mentioned',
                        $request->user()->name . ' mentioned you in a message: "' . \Illuminate\Support\Str::limit($validated['body'] ?? '', 50) . '"',
                        ['conversation_id' => $conversation->id, 'message_id' => $message->id],
                        '/dashboard/chat?conversation=' . $conversation->id,
                        'normal'
                    );
                }
            }
        } elseif ($conversation->scope === 'direct') {
            $otherUserId = $conversation->users()->where('users.id', '!=', $request->user()->id)->value('users.id');
            if ($otherUserId) {
                NotificationService::send(
                    $otherUserId,
                    'chat',
                    'New message from ' . $request->user()->name,
                    \Illuminate\Support\Str::limit($validated['body'] ?? 'Sent an attachment', 50),
                    ['conversation_id' => $conversation->id, 'message_id' => $message->id],
                    '/dashboard/chat?conversation=' . $conversation->id,
                    'normal'
                );
            }
        }

        try {
            broadcast(new MessageSent($message))->toOthers();
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json($message->load(['sender', 'replyTo']));
    }

    public function editMessage(Request $request, $id, $msgId)
    {
        $conversation = Conversation::findOrFail($id);
        $this->checkAccess($conversation, $request->user());

        $message = Message::where('conversation_id', $id)->findOrFail($msgId);

        if ($message->sender_id !== $request->user()->id) {
            abort(403, 'You can only edit your own messages');
        }

        if ($message->type !== 'text') {
            abort(400, 'Only text messages can be edited');
        }

        if ($message->created_at->diffInMinutes(now()) > 15) {
            abort(403, 'Messages can only be edited within 15 minutes of sending');
        }

        $validated = $request->validate([
            'body' => 'required|string',
        ]);

        $message->update([
            'body' => $validated['body'],
            'edited_at' => now(),
        ]);

        try {
            broadcast(new \App\Events\MessageEdited($message->load(['sender', 'replyTo'])))->toOthers();
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json($message);
    }
    
    public function markRead(Request $request, $id)
    {
        $conversation = Conversation::findOrFail($id);
        $this->checkAccess($conversation, $request->user());

        Message::where('conversation_id', $conversation->id)
            ->where('sender_id', '!=', $request->user()->id)
            ->whereDoesntHave('reads', function ($q) use ($request) {
                $q->where('user_id', $request->user()->id);
            })
            ->chunkById(200, function ($messages) use ($request) {
                $upserts = [];
                $now = now();
                foreach ($messages as $msg) {
                    $upserts[] = [
                        'message_id' => $msg->id,
                        'user_id' => $request->user()->id,
                        'read_at' => $now,
                        'updated_at' => $now,
                        'created_at' => $now,
                    ];
                }
                if (!empty($upserts)) {
                    \Illuminate\Support\Facades\DB::table('conversation_message_reads')->upsert(
                        $upserts,
                        ['message_id', 'user_id'],
                        ['read_at', 'updated_at']
                    );
                }
            });

        if ($conversation->scope !== 'global') {
            $conversation->users()->updateExistingPivot($request->user()->id, ['last_read_at' => now()]);
        }

        if ($conversation->scope === 'direct') {
            try {
                broadcast(new MessageRead($conversation->id, $request->user()->id))->toOthers();
            } catch (\Throwable $e) {
            report($e);
        }
        }

        return response()->json(['success' => true]);
    }

    public function markAllRead(Request $request)
    {
        $user = $request->user();
        
        $conversations = Conversation::where(function ($query) use ($user) {
            $query->whereHas('users', function ($q) use ($user) {
                $q->where('users.id', $user->id);
            })->orWhere('scope', 'global');
        })->get();

        foreach ($conversations as $conversation) {
            Message::where('conversation_id', $conversation->id)
                ->where('sender_id', '!=', $user->id)
                ->whereDoesntHave('reads', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                })
                ->chunkById(200, function ($messages) use ($user) {
                    $upserts = [];
                    $now = now();
                    foreach ($messages as $msg) {
                        $upserts[] = [
                            'message_id' => $msg->id,
                            'user_id' => $user->id,
                            'read_at' => $now,
                            'updated_at' => $now,
                            'created_at' => $now,
                        ];
                    }
                    if (!empty($upserts)) {
                        \Illuminate\Support\Facades\DB::table('conversation_message_reads')->upsert(
                            $upserts,
                            ['message_id', 'user_id'],
                            ['read_at', 'updated_at']
                        );
                    }
                });

            if ($conversation->scope !== 'global') {
                $conversation->users()->updateExistingPivot($user->id, ['last_read_at' => now()]);
            }
        }

        return response()->json(['success' => true]);
    }

    public function startDirectMessage(Request $request)
    {
        $validated = $request->validate([
            'recipient_id' => 'required|exists:users,id,status,active',
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
            ->has('users', '=', 2)
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
            report($e);
        }

        return response()->json($conversation);
    }

    public function createGroup(Request $request)
    {
        $role = $request->user()->resolveActiveRole();
        if (!CapabilityMatrix::hasCapability($role, 'chat.manage')) {
            abort(403, 'Unauthorized to create groups.');
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

        if ($conversation->scope !== 'project') {
            abort(403, 'Message pinning is only supported in project conversations.');
        }

        $role = $request->user()->resolveActiveRole();
        $hasChatManage = CapabilityMatrix::hasCapability($role, 'chat.manage');

        if (!$hasChatManage && $role !== 'super_admin') {
            abort(403, 'Unauthorized to pin messages');
        }

        $message = Message::where('conversation_id', $conversationId)->findOrFail($messageId);
        $message->update([
            'pinned' => true
        ]);

        try {
            broadcast(new \App\Events\MessagePinned($conversationId, $message->id))->toOthers();
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json($message);
    }

    public function unpinMessage(Request $request, $conversationId, $messageId)
    {
        $conversation = Conversation::findOrFail($conversationId);
        $this->checkAccess($conversation, $request->user());

        if ($conversation->scope !== 'project') {
            abort(403, 'Message unpinning is only supported in project conversations.');
        }

        $role = $request->user()->resolveActiveRole();
        $hasChatManage = CapabilityMatrix::hasCapability($role, 'chat.manage');

        if (!$hasChatManage && $role !== 'super_admin') {
            abort(403, 'Unauthorized to unpin messages');
        }

        $message = Message::where('conversation_id', $conversationId)->findOrFail($messageId);
        $message->update([
            'pinned' => false
        ]);

        try {
            broadcast(new \App\Events\MessageUnpinned($conversationId, $message->id))->toOthers();
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json($message);
    }

    public function pinChat(Request $request, $id)
    {
        $conversation = Conversation::findOrFail($id);
        $this->checkAccess($conversation, $request->user());

        if ($conversation->scope === 'global') {
            return response()->json(['message' => 'Global chat cannot be pinned.'], 422);
        }

        $pinnedCount = \Illuminate\Support\Facades\DB::table('conversation_user')
            ->where('user_id', $request->user()->id)
            ->where('is_pinned', true)
            ->count();

        if ($pinnedCount >= 100) {
            return response()->json(['message' => 'You can only pin up to 100 conversations.'], 422);
        }

        if (!$conversation->users()->where('users.id', $request->user()->id)->exists()) {
            $conversation->users()->attach($request->user()->id, ['is_pinned' => true]);
        } else {
            $conversation->users()->updateExistingPivot($request->user()->id, ['is_pinned' => true]);
        }

        return response()->json(['success' => true]);
    }

    public function unpinChat(Request $request, $id)
    {
        $conversation = Conversation::findOrFail($id);
        $this->checkAccess($conversation, $request->user());

        if ($conversation->scope === 'global') {
            return response()->json(['message' => 'Global chat cannot be unpinned.'], 422);
        }

        if (!$conversation->users()->where('users.id', $request->user()->id)->exists()) {
            $conversation->users()->attach($request->user()->id, ['is_pinned' => false]);
        } else {
            $conversation->users()->updateExistingPivot($request->user()->id, ['is_pinned' => false]);
        }

        return response()->json(['success' => true]);
    }
    public function deleteMessage(Request $request, $id, $msgId)
    {
        $conversation = Conversation::findOrFail($id);
        $this->checkAccess($conversation, $request->user());

        $message = Message::where('conversation_id', $id)->findOrFail($msgId);

        if ($message->sender_id !== $request->user()->id) {
            abort(403, 'You can only delete your own messages');
        }

        $msgIdForBroadcast = $message->id;
        $attachmentUrl = $message->attachment_url;
        $message->delete();

        if ($attachmentUrl) {
            try {
                $basename = basename(parse_url($attachmentUrl, PHP_URL_PATH));
                \Illuminate\Support\Facades\Storage::disk(config('filesystems.default'))->delete('chat_attachments/' . $basename);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Failed to delete chat attachment on message delete: ' . $e->getMessage());
            }
        }

        try {
            broadcast(new \App\Events\MessageDeleted($conversation->id, $msgIdForBroadcast))->toOthers();
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json(['success' => true]);
    }

    public function clearChat(Request $request, $id)
    {
        $conversation = Conversation::findOrFail($id);
        $this->checkAccess($conversation, $request->user());

        if (!$conversation->users()->where('users.id', $request->user()->id)->exists()) {
            $conversation->users()->attach($request->user()->id, ['cleared_at' => now()]);
        } else {
            $conversation->users()->updateExistingPivot($request->user()->id, ['cleared_at' => now()]);
        }

        return response()->json(['success' => true]);
    }

}

