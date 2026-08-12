const fs = require('fs');
let code = fs.readFileSync('apps/api/app/Http/Controllers/ChatController.php', 'utf8');

const oldMessages = `->with(['sender', 'replyTo'])`;
code = code.replace(oldMessages, `->with(['sender', 'replyTo', 'reads'])`);

const oldValidation = `'reply_to_id' => 'nullable|exists:messages,id',`;
const newValidation = `'reply_to_id' => 'nullable|exists:messages,id',
            'mentions' => 'nullable|array',
            'mentions.*' => 'integer|exists:users,id',`;
code = code.replace(oldValidation, newValidation);

const mentionLogic = `
        if (!empty($validated['mentions'])) {
            foreach ($validated['mentions'] as $userId) {
                if ($userId !== $request->user()->id) {
                    \\App\\Models\\Notification::create([
                        'user_id' => $userId,
                        'type' => 'mention',
                        'title' => 'You were mentioned',
                        'body' => $request->user()->name . ' mentioned you in a message.',
                        'link' => '/dashboard/chat?conversation=' . $conversation->id,
                    ]);
                }
            }
        }

        broadcast(new MessageSent($message))->toOthers();`;
code = code.replace('broadcast(new MessageSent($message))->toOthers();', mentionLogic);

const markReadMethod = `
    public function markRead(Request $request, $id)
    {
        $conversation = Conversation::findOrFail($id);
        $this->checkAccess($conversation, $request->user());

        $unreadMessages = Message::where('conversation_id', $conversation->id)
            ->where('sender_id', '!=', $request->user()->id)
            ->whereDoesntHave('reads', function ($q) use ($request) {
                $q->where('user_id', $request->user()->id);
            })
            ->get();

        foreach ($unreadMessages as $msg) {
            \\Illuminate\\Support\\Facades\\DB::table('conversation_message_reads')->updateOrInsert(
                ['message_id' => $msg->id, 'user_id' => $request->user()->id],
                ['read_at' => now(), 'updated_at' => now(), 'created_at' => now()]
            );
        }

        if ($conversation->scope !== 'global') {
            $conversation->users()->updateExistingPivot($request->user()->id, ['last_read_at' => now()]);
        }

        return response()->json(['success' => true]);
    }
`;

code = code.replace('public function startDirectMessage', markReadMethod + '\n    public function startDirectMessage');

fs.writeFileSync('apps/api/app/Http/Controllers/ChatController.php', code);
console.log('Patched ChatController.php');
