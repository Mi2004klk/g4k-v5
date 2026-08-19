<?php
require __DIR__ . '/apps/api/vendor/autoload.php';
$app = require_once __DIR__ . '/apps/api/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::find(126);
$request = \Illuminate\Http\Request::create('/api/tasks/110/approve', 'POST');
$request->setUserResolver(function () use ($user) { return $user; });

$controller = $app->make(\App\Http\Controllers\TaskController::class);
$response = $controller->approve($request, 110);

echo "Status Code: " . $response->getStatusCode() . "\n";
echo "Content: " . $response->getContent() . "\n";
