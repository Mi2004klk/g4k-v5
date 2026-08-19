<?php
require __DIR__ . '/apps/api/vendor/autoload.php';
$app = require_once __DIR__ . '/apps/api/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$approvals = \App\Models\Approval::all();
echo "Total approvals: " . $approvals->count() . "\n";
foreach ($approvals as $a) {
    echo "ID: {$a->id}, Type: {$a->approvable_type}, ID: {$a->approvable_id}, Status: {$a->status}\n";
}
