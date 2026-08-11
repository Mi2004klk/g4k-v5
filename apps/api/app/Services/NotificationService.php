<?php

namespace App\Services;

use App\Models\Notification;
use App\Events\NotificationCreated;

class NotificationService
{
    public static function send(int $userId, string $type, string $title, string $body, ?array $data = null, ?string $link = null, string $priority = 'normal'): Notification
    {
        $notification = Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'priority' => $priority,
            'title' => $title,
            'body' => $body,
            'data' => $data,
            'link' => $link,
        ]);


        return $notification;
    }
}
