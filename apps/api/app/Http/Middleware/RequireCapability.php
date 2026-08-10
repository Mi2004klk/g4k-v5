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

        if (!$activeRole) {
            return response()->json(['message' => 'Role not selected.'], 403);
        }

        if ($activeRole !== 'super_admin' && !\App\Services\CapabilityMatrix::hasCapability($activeRole, $capability)) {
            \Illuminate\Support\Facades\Log::info('Capability check failed', ['role' => $activeRole, 'cap' => $capability]);
            return response()->json(['message' => 'Lacking capability ' . $capability], 403);
        }

        $capabilities = explode('|', $capability);
        $hasAny = false;
        foreach ($capabilities as $cap) {
            if (CapabilityMatrix::hasCapability($activeRole, $cap)) {
                $hasAny = true;
                break;
            }
        }

        if (!$hasAny) {
            abort(403, 'Unauthorized action. Missing capability: ' . $capability);
        }

        return $next($request);
    }
}
