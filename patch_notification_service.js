const fs = require('fs');

let code = fs.readFileSync('apps/api/app/Services/NotificationService.php', 'utf8');

const oldSend = `    public static function send(int $userId, string $type, string $title, string $body, ?array $data = null, ?string $link = null, string $priority = 'normal'): Notification
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
    }`;

const newSend = `    public static function send(int $userId, string $type, string $title, string $body, ?array $data = null, ?string $link = null, string $priority = 'normal'): ?Notification
    {
        $user = \\App\\Models\\User::find($userId);
        if ($user && isset($user->preferences['notifications'][$type]) && $user->preferences['notifications'][$type] === false) {
            return null;
        }

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
    }`;

code = code.replace(oldSend, newSend);

fs.writeFileSync('apps/api/app/Services/NotificationService.php', code);
console.log('Patched NotificationService.php');
