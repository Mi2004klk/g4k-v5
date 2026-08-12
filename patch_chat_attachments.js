const fs = require('fs');
let code = fs.readFileSync('apps/api/app/Http/Controllers/ChatController.php', 'utf8');

const oldMessageCreate = `$message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $request->user()->id,
            'body' => $validated['body'] ?? '',
            'type' => $validated['type'] ?? 'text',
            'attachment_url' => $validated['attachment_url'] ?? null,
            'reply_to_id' => $validated['reply_to_id'] ?? null,
        ]);`;

const newMessageCreate = `
        $attachmentUrl = $validated['attachment_url'] ?? null;
        $type = $validated['type'] ?? 'text';

        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('chat_attachments', 'supabase');
            $attachmentUrl = \\Illuminate\\Support\\Facades\\Storage::disk('supabase')->url($path);
            
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
        ]);`;

code = code.replace(oldMessageCreate, newMessageCreate);

const oldValidation = `'reply_to_id' => 'nullable|exists:messages,id',
            'mentions' => 'nullable|array',
            'mentions.*' => 'integer|exists:users,id',`;
const newValidation = `'attachment' => 'nullable|file|max:10240',
            'reply_to_id' => 'nullable|exists:messages,id',
            'mentions' => 'nullable|array',
            'mentions.*' => 'integer|exists:users,id',`;

code = code.replace(oldValidation, newValidation);

fs.writeFileSync('apps/api/app/Http/Controllers/ChatController.php', code);
console.log('Patched ChatController.php for attachments');
