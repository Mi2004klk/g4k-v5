<?php
require __DIR__ . '/apps/api/vendor/autoload.php';
$app = require_once __DIR__ . '/apps/api/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$task = \App\Models\Task::with('approval')->find(110);
if ($task) {
    echo "Found task {$task->id} eager loaded\n";
    var_dump($task->approval);
} else {
    echo "Task 110 not found.\n";
}
