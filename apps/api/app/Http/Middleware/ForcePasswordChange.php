<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForcePasswordChange
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if ($user && $user->must_change_password) {
            $settings = \Illuminate\Support\Facades\Cache::remember('settings:security', 60 * 60, function () {
                $rawSettings = \Illuminate\Support\Facades\DB::table('settings')
                    ->where('category', 'security')
                    ->pluck('value', 'key')
                    ->toArray();
                    
                $decoded = [];
                foreach ($rawSettings as $k => $v) {
                    $dec = json_decode($v, true);
                    $decoded[$k] = (json_last_error() === JSON_ERROR_NONE) ? $dec : $v;
                }
                return $decoded;
            });
            
            $isCompulsive = filter_var($settings['force_password_change'] ?? true, FILTER_VALIDATE_BOOLEAN);

            if ($isCompulsive) {
                if (!$request->is('api/auth/change-password') && !$request->is('api/auth/logout') && !$request->is('api/auth/sessions') && !$request->is('api/auth/sessions/*') && !$request->is('api/auth/role-select') && !$request->is('api/auth/skip-password-change')) {
                    return response()->json([
                        'message' => 'You must change your password before continuing.',
                        'must_change_password' => true
                    ], 403);
                }
            }
        }
        return $next($request);
    }
}
