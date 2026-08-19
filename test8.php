<?php
require __DIR__ . '/apps/api/vendor/autoload.php';
$app = require_once __DIR__ . '/apps/api/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$request = \Illuminate\Http\Request::create('/api/tasks', 'POST', [
    'title' => 'Test Task creation',
    'description' => 'Testing if it crashes',
    'priority' => 'medium',
    'assignees' => [126], // Using a valid user ID (assuming 126 is valid)
]);
$request->setUserResolver(function() { return \App\Models\User::find(126); });
$controller = app(\App\Http\Controllers\TaskController::class);
try {
    $response = $controller->store($request);
    echo "Response status: " . $response->getStatusCode() . "\n";
    echo $response->getContent() . "\n";
} catch (\Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
