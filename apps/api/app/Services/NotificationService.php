<?php

namespace App\Services;

use App\Models\Notification;
use App\Events\NotificationCreated;

class NotificationService
{
    public static function send(int $userId, string $type, string $title, string $body, ?array $data = null, ?string $link = null): Notification
    {
        $notification = Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'data' => $data,
            'link' => $link,
        ]);

        event(new NotificationCreated($notification));

        return $notification;
    }
}
