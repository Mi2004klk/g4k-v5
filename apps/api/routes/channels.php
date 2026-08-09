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
