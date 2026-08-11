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
            // Exclude allowed routes (logout, onboarding, role-select, sessions, change-password)
            $allowedRoutes = [
                'api/auth/onboarding/complete',
                'api/auth/logout',
                'api/auth/change-password',
                'api/auth/role-select',
                'api/auth/sessions',
            ];
            
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
