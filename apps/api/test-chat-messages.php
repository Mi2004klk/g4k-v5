<?php
require __DIR__."/vendor/autoload.php";
$app = require_once __DIR__."/bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$request = Illuminate\Http\Request::create("/api/conversations/2/messages", "GET");
$request->setUserResolver(function() { return App\Models\User::find(1); });
$controller = app()->make(App\Http\Controllers\ChatController::class);
try {
    dump($controller->messages($request, 2)->content());
} catch (\Exception $e) {
    dump($e->getMessage());
}

