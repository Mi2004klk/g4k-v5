<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$user = \App\Models\User::first();
if (!$user) {
    die("No user found");
}

$request = Illuminate\Http\Request::create('/api/announcements', 'POST', [
    'title' => 'Test title',
    'body' => 'Test body',
    'scope' => 'company',
    'pinned' => false
]);
$request->setUserResolver(function() use ($user) { return $user; });

$response = $kernel->handle($request);
echo "Status: " . $response->getStatusCode() . "\n";
echo "Content: " . $response->getContent() . "\n";
