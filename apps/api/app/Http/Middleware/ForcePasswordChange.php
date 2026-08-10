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
        // Disabled: reset password on first login
        if (false && $user && $user->must_change_password) {
            // Exclude allowed routes. Note: $request->path() does not include a leading slash
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
