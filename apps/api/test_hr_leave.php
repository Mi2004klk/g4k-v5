<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\LeaveRequest;
use App\Models\RoleAssignment;
use App\Services\ApprovalService;

// Create HR user
$hrUser1 = User::factory()->create(['name' => 'HR User 1']);
RoleAssignment::create(['user_id' => $hrUser1->id, 'role' => 'hr']);

$hrUser2 = User::factory()->create(['name' => 'HR User 2']);
RoleAssignment::create(['user_id' => $hrUser2->id, 'role' => 'hr']);

$superAdmin = User::factory()->create(['name' => 'Super Admin']);
RoleAssignment::create(['user_id' => $superAdmin->id, 'role' => 'super_admin']);

// Simulate HR 1 creating a leave request
$request = new \Illuminate\Http\Request();
$request->setUserResolver(function () use ($hrUser1) { return $hrUser1; });

// Give them some balance
\App\Models\LeaveBalance::create([
    'user_id' => $hrUser1->id,
    'leave_type' => 'sick',
    'year' => date('Y'),
    'allowed' => 10,
    'used' => 0
]);

$controller = app(\App\Http\Controllers\LeaveRequestController::class);

$payload = [
    'start_date' => date('Y-m-d', strtotime('+1 day')),
    'end_date' => date('Y-m-d', strtotime('+2 days')),
    'reason' => 'Sick',
    'type' => 'sick',
];

$storeRequest = \App\Http\Requests\StoreLeaveRequestRequest::create('/api/leave-requests', 'POST', $payload);
$storeRequest->setUserResolver(function () use ($hrUser1) { return $hrUser1; });
// Bypass form request validation for simplicity, or just create directly
$leave = LeaveRequest::create(array_merge($payload, ['user_id' => $hrUser1->id, 'status' => 'pending']));
$approval = ApprovalService::submit($leave, $hrUser1->id, $payload);
$leave->update(['approval_id' => $approval->id]);

echo "Leave created. Approval ID: {$approval->id}, current_approver_role: {$approval->current_approver_role}\n";

// Now Super Admin tries to approve
echo "Super Admin approving...\n";
try {
    $decideRequest = \Illuminate\Http\Request::create("/api/approvals/{$approval->id}/decision", 'POST', [
        'decision' => 'approved',
    ]);
    $decideRequest->setUserResolver(function () use ($superAdmin) { return $superAdmin; });
    $response = $controller->decision($decideRequest, $approval->id);
    echo "Super Admin response status: " . $response->status() . "\n";
    if ($response->status() !== 200) {
        echo "Response: " . $response->content() . "\n";
    }
} catch (\Exception $e) {
    echo "Super Admin Error: " . $e->getMessage() . "\n";
}

// What if another HR tries to approve?
$leave2 = LeaveRequest::create(array_merge($payload, ['user_id' => $hrUser1->id, 'status' => 'pending']));
$approval2 = ApprovalService::submit($leave2, $hrUser1->id, $payload);
$leave2->update(['approval_id' => $approval2->id]);
echo "\nLeave 2 created. Approval ID: {$approval2->id}, current_approver_role: {$approval2->current_approver_role}\n";
echo "HR 2 approving...\n";
try {
    $decideRequest = \Illuminate\Http\Request::create("/api/approvals/{$approval2->id}/decision", 'POST', [
        'decision' => 'approved',
    ]);
    $decideRequest->setUserResolver(function () use ($hrUser2) { return $hrUser2; });
    $response = $controller->decision($decideRequest, $approval2->id);
    echo "HR 2 response status: " . $response->status() . "\n";
    if ($response->status() !== 200) {
        echo "Response: " . $response->content() . "\n";
    }
} catch (\Exception $e) {
    echo "HR 2 Error: " . $e->getMessage() . "\n";
}
