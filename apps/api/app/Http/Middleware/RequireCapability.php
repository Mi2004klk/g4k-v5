<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Services\CapabilityMatrix;

class RequireCapability
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $capability): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        $token = $user->currentAccessToken();
        if (!$token) {
            abort(401, 'No active session token');
        }

        $activeRole = null;
        foreach ($token->abilities as $ability) {
            if (str_starts_with($ability, 'role:')) {
                $activeRole = substr($ability, 5);
                break;
            }
        }

        if (!$activeRole) {
            return response()->json(['message' => 'Role not selected.'], 403);
        }

        if (!CapabilityMatrix::hasCapability($activeRole, $capability)) {
            abort(403, 'Unauthorized action. Missing capability: ' . $capability);
        }

        return $next($request);
    }
}
