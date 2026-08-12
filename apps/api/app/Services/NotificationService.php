<?php

namespace App\Services;

use App\Models\Notification;
use App\Events\NotificationCreated;

class NotificationService
{
    public static function send(int $userId, string $type, string $title, string $body, ?array $data = null, ?string $link = null, string $priority = 'normal'): ?Notification
    {
        $user = \App\Models\User::find($userId);
        
        $globalChannels = \Illuminate\Support\Facades\Cache::remember("settings:notifications:{$type}.channels", 3600, function() use ($type) {
            $val = \Illuminate\Support\Facades\DB::table('settings')->where('category', 'notifications')->where('key', "{$type}.channels")->value('value');
            return $val ? json_decode($val, true) : ['in_app']; // Default to in_app if not configured
        });

        // If user explicitly disabled this type of notification completely
        if ($user && isset($user->preferences['notifications'][$type]) && $user->preferences['notifications'][$type] === false) {
            return null;
        }

        // Determine user channels override, else fallback to global
        $userChannels = $user->preferences['notifications'][$type]['channels'] ?? null;
        $channels = $userChannels ?: $globalChannels;

        if (in_array('in_app', $channels)) {
            $notification = Notification::create([
                'user_id' => $userId,
                'type' => $type,
                'priority' => $priority,
                'title' => $title,
                'body' => $body,
                'data' => $data,
                'link' => $link,
            ]);
        }

        if (in_array('email', $channels) && $user && \App\Support\SmtpSettings::isConfigured()) {
            \App\Support\SmtpSettings::apply();
            try {
                // Here we would dispatch an email notification job
                // For now, just log that we would have sent it, since we don't have a generic NotificationMail class
                \Illuminate\Support\Facades\Log::info("Would send email notification to {$user->email}: {$title}");
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Failed to send email notification to {$user->email}: " . $e->getMessage());
            }
        }

        return $notification ?? null;
    }
}
