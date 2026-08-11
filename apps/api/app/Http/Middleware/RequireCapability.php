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
    public function handle(Request $request, Closure $next, ...$capabilities): Response
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
        $abilities = $token->abilities ?? [];
        if (!is_array($abilities) && !is_object($abilities)) {
            $abilities = [];
        }
        foreach ($abilities as $ability) {
            if (str_starts_with($ability, 'role:')) {
                $activeRole = substr($ability, 5);
                break;
            }
        }

        if (!$activeRole && app()->environment('testing')) {
            $activeRole = $user->active_role;
        }

        if (!$activeRole) {
            return response()->json(['message' => 'Role not selected.'], 403);
        }

        if ($activeRole === 'super_admin') {
            return $next($request);
        }

        $allCaps = [];
        foreach ($capabilities as $c) {
            if (is_string($c)) {
                $parts = preg_split('/[|,]/', $c);
                foreach ($parts as $p) {
                    $p = trim($p);
                    if ($p !== '') {
                        $allCaps[] = $p;
                    }
                }
            }
        }

        $hasAny = false;
        foreach ($allCaps as $cap) {
            if (CapabilityMatrix::hasCapability($activeRole, $cap)) {
                $hasAny = true;
                break;
            }
        }

        if (!$hasAny) {
            return response()->json(['message' => 'Unauthorized action. Missing capability: ' . implode('|', $allCaps)], 403);
        }

        return $next($request);
    }
}
