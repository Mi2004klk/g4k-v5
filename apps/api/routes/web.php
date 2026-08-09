<?php

use Illuminate\Support\Facades\Route;

Route::get('/ping', function () { return 'pong web'; });
Route::get('/api/ping', function () { return 'pong web api'; });

Route::post('/auth/login', [App\Http\Controllers\AuthController::class, 'login']);
Route::post('/api/auth/login', [App\Http\Controllers\AuthController::class, 'login']);

Route::get('/auth/refresh', [App\Http\Controllers\AuthController::class, 'refresh']);
Route::get('/api/auth/refresh', [App\Http\Controllers\AuthController::class, 'refresh']);

Route::get('/auth/preferences', [App\Http\Controllers\UserPreferenceController::class, 'show']);
Route::get('/api/auth/preferences', [App\Http\Controllers\UserPreferenceController::class, 'show']);

Route::get('/', function () {
    return view('welcome');
});

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});
