<?php
require __DIR__."/vendor/autoload.php";
$app = require_once __DIR__."/bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$request = Illuminate\Http\Request::create("/api/conversations/dm", "POST", ["recipient_id" => 3]);
$request->setUserResolver(function() { return App\Models\User::find(1); });
$controller = app()->make(App\Http\Controllers\ChatController::class);
try {
    dump($controller->startDirectMessage($request)->content());
} catch (\Exception $e) {
    dump($e->getMessage());
}

