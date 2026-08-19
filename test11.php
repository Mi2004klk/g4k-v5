<?php
require __DIR__ . '/apps/api/vendor/autoload.php';
$app = require_once __DIR__ . '/apps/api/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$task = \App\Models\Task::with('approval')->find(110);
var_dump($task->approval);
var_dump(\App\Models\Approval::where('approvable_id', 110)->where('approvable_type', 'App\\Models\\Task')->get()->toArray());
