<?php

use Illuminate\Support\Facades\Route;

// Web routes are for browser/session-based entry points only. The API lives entirely in
// routes/api.php (auto-prefixed with /api). DO NOT register API/auth routes here:
//   - They bypass Sanctum + capability middleware (security hole).
//   - They collide with api routes during `php artisan route:cache` and break route resolution
//     (this was the root cause of the production 404 "route api/auth/login could not be found").

Route::get('/', function () {
    return view('welcome');
});

// Lightweight unauthenticated health check for Cloud Run / uptime probe.
Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});
