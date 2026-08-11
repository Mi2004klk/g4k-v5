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
            // AUTH-5: Always enforce force_password_change when must_change_password=true
            // (Ignoring the security.force_password_change setting from the database for stricter security)
            $allowedRoutes = ['api/auth/change-password', 'api/auth/logout'];
            
            if (!in_array($request->path(), $allowedRoutes)) {
                return response()->json([
                    'message' => 'You must change your password before continuing.',
                    'must_change_password' => true
                ], 403);
            }
        }
        return $next($request);
    }
}
