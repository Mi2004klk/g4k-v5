<?php

use Illuminate\Support\Facades\Route;

Route::get('/ping', function () { return 'pong web'; });

Route::get('/', function () {
    return view('welcome');
});

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});
