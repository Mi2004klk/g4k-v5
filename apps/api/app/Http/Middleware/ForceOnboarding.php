<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForceOnboarding
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if ($user && is_null($user->onboarded_at)) {
            // Exclude allowed routes (logout and onboarding itself)
            // also we shouldn't block change-password because it happens before onboarding
            $allowedRoutes = ['api/auth/onboarding/complete', 'api/auth/logout', 'api/auth/change-password'];
            
            if (!in_array($request->path(), $allowedRoutes)) {
                return response()->json([
                    'message' => 'You must complete onboarding before continuing.',
                    'needs_onboarding' => true
                ], 403);
            }
        }
        return $next($request);
    }
}
