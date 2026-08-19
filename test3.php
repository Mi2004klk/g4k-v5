<?php
require __DIR__ . '/apps/api/vendor/autoload.php';
$app = require_once __DIR__ . '/apps/api/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$task = \App\Models\Task::find(110);
if ($task) {
    echo "Found task {$task->id}\n";
    $appr = $task->approval;
    if ($appr) {
        echo "Approval found! Status: {$appr->status}\n";
    } else {
        echo "Approval is NULL\n";
    }
} else {
    echo "Task 110 not found.\n";
}
