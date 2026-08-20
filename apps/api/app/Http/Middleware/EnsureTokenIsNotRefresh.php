<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTokenIsNotRefresh
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->currentAccessToken()) {
            $abilities = $user->currentAccessToken()->abilities ?? [];
            if (in_array('refresh', $abilities)) {
                return response()->json([
                    'message' => 'Invalid token type for API access. Refresh tokens can only be used on the refresh endpoint.'
                ], 403);
            }
        }

        return $next($request);
    }
}
