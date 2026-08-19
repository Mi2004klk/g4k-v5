<?php
require __DIR__ . '/apps/api/vendor/autoload.php';
$app = require_once __DIR__ . '/apps/api/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$events = ['created', 'assigned', 'progress', 'submitted', 'approved', 'redo'];
foreach ($events as $event) {
    try {
        \App\Models\TaskActivity::create([
            'task_id' => 110,
            'user_id' => 126,
            'event' => $event,
            'metadata' => ['test' => true]
        ]);
        echo "Event {$event} created successfully.\n";
    } catch (\Exception $e) {
        echo "Exception for {$event}: " . $e->getMessage() . "\n";
    }
}
