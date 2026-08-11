<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('private-user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('presence-org', function ($user) {
    if ($user) {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar_url' => $user->avatar_url,
        ];
    }
    return false;
});

Broadcast::channel('conversation.{id}', function ($user, $id) {
    $conversation = \App\Models\Conversation::find($id);
    if (!$conversation) {
        return false;
    }
    if ($conversation->scope === 'global') {
        return true;
    }
    return \Illuminate\Support\Facades\DB::table('conversation_user')
        ->where('user_id', $user->id)
        ->where('conversation_id', $id)
        ->exists();
});
