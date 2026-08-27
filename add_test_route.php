<?php
$content = file_get_contents('apps/api/routes/api.php');
$content .= "\nRoute::get('/test-projects', function (\\Illuminate\\Http\\Request \$request) { \$user = App\\Models\\User::where('email', 'admin@example.com')->first(); auth('sanctum')->login(\$user); \$request->setUserResolver(function() use (\$user) { return \$user; }); return app(\\App\\Http\\Controllers\\ProjectController::class)->index(\$request); });\n";
file_put_contents('apps/api/routes/api.php', $content);
