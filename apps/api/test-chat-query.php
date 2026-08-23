<?php
require __DIR__."/vendor/autoload.php";
$app = require_once __DIR__."/bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $existing = App\Models\Conversation::where("scope", "direct")
        ->whereHas("users", function ($q) {
            $q->where("users.id", 1);
        })
        ->whereHas("users", function ($q) {
            $q->where("users.id", 2);
        })
        ->where(function ($q) {
            $q->whereRaw("(SELECT COUNT(*) FROM conversation_user WHERE conversation_user.conversation_id = conversations.id) = 2");
        })
        ->first();
    dump($existing ? $existing->id : "Not found");
} catch (\Exception $e) {
    dump($e->getMessage());
}

