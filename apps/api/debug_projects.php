<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';

// Create kernel
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

try {
    $user = App\Models\User::where('email', 'admin@example.com')->first() ?? App\Models\User::first();
    $app->make(\Illuminate\Contracts\Auth\Factory::class)->guard('sanctum')->setUser($user);
    $app->instance('request', \Illuminate\Http\Request::create('/api/projects', 'GET', ['per_page' => 1000]));
    
    $request = app('request');
    $request->setUserResolver(function() use ($user) { return $user; });
    
    $response = $kernel->handle($request);
    echo "STATUS: " . $response->getStatusCode() . "\n";
    if ($response->getStatusCode() == 500) {
        echo "CONTENT: " . $response->exception->getMessage() . "\n" . $response->exception->getTraceAsString() . "\n";
    } else {
        echo "CONTENT: " . $response->getContent() . "\n";
    }
} catch (\Throwable $e) {
    echo "EXCEPTION: " . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n";
}
