<?php
require __DIR__ . '/apps/api/vendor/autoload.php';
$app = require_once __DIR__ . '/apps/api/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    \App\Models\TaskActivity::create([
        'task_id' => 110,
        'user_id' => 126,
        'event' => 'created',
        'metadata' => ['test' => true]
    ]);
    echo "TaskActivity created successfully.\n";
} catch (\Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}
