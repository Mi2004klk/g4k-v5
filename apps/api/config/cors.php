<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'broadcasting/auth'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('FRONTEND_URL'),
        'https://g4-k-web.vercel.app'
    ],

    'allowed_origins_patterns' => [
        '#^https://g4-k-web-[a-z0-9]+-naval-treasure-group\.vercel\.app$#i',
        '#^http://localhost:\d+$#'
    ],

    'allowed_headers' => ['*', 'X-Refresh-Token', 'Authorization', 'Content-Type', 'Accept', 'X-Socket-Id'],

    'exposed_headers' => [],

    'max_age' => 3600,

    'supports_credentials' => true,

];
