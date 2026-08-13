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
        env('FRONTEND_URL', 'http://localhost:3000'),
        'https://g4k-v4.vercel.app',
        'https://g4k-v4-p24bp49v9-naval-treasure-group.vercel.app',
    ],

    'allowed_origins_patterns' => [
        '#^http://localhost:\d+$#',
        '#^https://.*\.vercel\.app$#'
    ],

    'allowed_headers' => ['*', 'X-Refresh-Token', 'Authorization', 'Content-Type', 'Accept', 'X-Socket-Id'],

    'exposed_headers' => [],

    'max_age' => 3600,

    'supports_credentials' => true,

];
