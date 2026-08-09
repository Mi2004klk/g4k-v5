<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\RoleAssignment;
use App\Models\LoginAttempt;
use App\Events\SessionRevoked;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Cookie;

class AuthController extends Controller
{
    private function createAuthCookies(string $refreshToken): Cookie
    {
        $isProduction = config('app.env') === 'production';
        
        return new Cookie(
            'g4k_refresh_token',
            $refreshToken,
            now()->addDays(7),
            '/',
            null, // domain defaults to request domain
            $isProduction, // secure
            true, // httpOnly
            false, // raw
            'Lax' // SameSite: Vercel Proxy makes it same-site
        );
    }

    public function login(Request $request)
    {
        $request->validate([
            'identifier' => 'required|string',
            'password' => 'required|string',
            'device_name' => 'nullable|string',
        ]);

        $throttleKey = Str::lower($request->input('identifier')) . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'message' => 'Account locked due to multiple failed login attempts. Try again in ' . ceil($seconds / 60) . ' minutes.',
                'retry_after' => $seconds
            ], 423);
        }

        $user = User::where('email', $request->identifier)
                    ->orWhere('employee_id', $request->identifier)
                    ->orWhere('username', $request->identifier)
                    ->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            RateLimiter::hit($throttleKey, 600);

            LoginAttempt::create([
                'identifier' => $request->identifier,
                'user_id' => $user?->id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->header('User-Agent'),
                'success' => false,
                'is_suspicious' => false,
            ]);

            throw ValidationException::withMessages([
                'identifier' => ['Invalid credentials.'],
            ]);
        }

        RateLimiter::clear($throttleKey);

        // Check suspicious login (new IP vs last successful IP)
        $lastSuccessfulLogin = LoginAttempt::where('user_id', $user->id)
            ->where('success', true)
            ->latest()
            ->first();

        $isSuspicious = false;
        if ($lastSuccessfulLogin && $lastSuccessfulLogin->ip_address !== $request->ip()) {
            $isSuspicious = true;
            Log::warning("Suspicious login detected for User ID {$user->id} ({$user->email}) from IP {$request->ip()} (previous: {$lastSuccessfulLogin->ip_address})");
        }

        // Record successful login
        LoginAttempt::create([
            'identifier' => $request->identifier,
            'user_id' => $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->header('User-Agent'),
            'success' => true,
            'is_suspicious' => $isSuspicious,
        ]);

        $rolesCollection = RoleAssignment::where('user_id', $user->id)->pluck('role');
        $user->roles = $rolesCollection->toArray();
        $primaryRole = $rolesCollection->first() ?? 'employee';

        $deviceName = $request->device_name ?? 'Unknown Device';

        // Issue Access Token
        $accessToken = $user->createToken($deviceName, ['role:' . $primaryRole])->plainTextToken;

        // Issue Refresh Token
        $refreshTokenObj = $user->createToken($deviceName . '_refresh', ['refresh']);
        $refreshToken = $refreshTokenObj->plainTextToken;

        $cookie = $this->createAuthCookies($refreshToken);

        return response()->json([
            'token' => $accessToken,
            'user' => $user,
            'active_role' => $primaryRole,
            'must_change_password' => (bool)$user->must_change_password,
            'onboarded' => !is_null($user->onboarded_at),
        ])->withCookie($cookie);
    }

    public function refresh(Request $request)
    {
        $rawRefreshToken = $request->cookie('g4k_refresh_token');

        if (!$rawRefreshToken) {
            return response()->json(['message' => 'Unauthenticated (No refresh cookie)'], 401);
        }

        $tokenInstance = PersonalAccessToken::findToken($rawRefreshToken);

        if (!$tokenInstance || !$tokenInstance->can('refresh')) {
            return response()->json(['message' => 'Invalid or expired refresh token'], 401);
        }

        /** @var User $user */
        $user = $tokenInstance->tokenable;

        if (!$user) {
            return response()->json(['message' => 'User not found'], 401);
        }

        // Revoke old refresh token (Token Rotation)
        $tokenInstance->delete();

        $rolesCollection = RoleAssignment::where('user_id', $user->id)->pluck('role');
        $user->roles = $rolesCollection->toArray();
        $primaryRole = $rolesCollection->first() ?? 'employee';

        // Issue new pair
        $newAccessToken = $user->createToken('Refreshed Session', ['role:' . $primaryRole])->plainTextToken;
        $newRefreshTokenObj = $user->createToken('Refreshed Session_refresh', ['refresh']);
        $newRefreshToken = $newRefreshTokenObj->plainTextToken;

        $cookie = $this->createAuthCookies($newRefreshToken);

        return response()->json([
            'token' => $newAccessToken,
            'user' => $user,
            'active_role' => $primaryRole,
            'must_change_password' => (bool)$user->must_change_password,
            'onboarded' => !is_null($user->onboarded_at),
        ])->withCookie($cookie);
    }

    public function roleSelect(Request $request)
    {
        $request->validate([
            'role' => 'required|string',
        ]);

        $user = $request->user();
        $roles = RoleAssignment::where('user_id', $user->id)->pluck('role')->toArray();

        if (!in_array($request->role, $roles)) {
            return response()->json(['message' => 'Role not assigned to user'], 403);
        }

        $deviceName = $user->currentAccessToken()->name;
        $user->currentAccessToken()->delete();

        $token = $user->createToken($deviceName, ['role:' . $request->role])->plainTextToken;
        $user->roles = $roles;

        return response()->json([
            'token' => $token,
            'user' => $user,
            'active_role' => $request->role
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'identifier' => 'required|string',
            'channel' => 'required|in:smtp,admin',
        ]);

        $user = User::where('email', $request->identifier)
            ->orWhere('username', $request->identifier)
            ->orWhere('employee_id', $request->identifier)
            ->first();

        if ($user) {
            Log::info("Password reset request for User ID {$user->id} via channel {$request->channel}");
            // Return 202 Accepted to prevent user enumeration attacks
        }

        return response()->json(['message' => 'If the account exists, password recovery instructions have been sent.'], 202);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'identifier' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::where('email', $request->identifier)
            ->orWhere('username', $request->identifier)
            ->orWhere('employee_id', $request->identifier)
            ->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'identifier' => ['User not found.'],
            ]);
        }

        $user->password = Hash::make($request->password);
        $user->must_change_password = false;
        $user->save();

        return response()->json(['message' => 'Password reset successful.']);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Incorrect current password.'],
            ]);
        }

        $user->password = Hash::make($request->password);
        $user->must_change_password = false;
        $user->save();

        return response()->json(['message' => 'Password changed successfully.']);
    }

    public function completeOnboarding(Request $request)
    {
        $user = $request->user();
        $user->onboarded_at = now();
        $user->save();

        return response()->json(['message' => 'Onboarding marked as completed.']);
    }

    public function sessions(Request $request)
    {
        $tokens = $request->user()->tokens->map(function($t) use ($request) {
            return [
                'id' => $t->id,
                'device_name' => $t->name,
                'ip_address' => $t->ip_address,
                'last_used_at' => $t->last_used_at,
                'is_current' => $t->id === $request->user()->currentAccessToken()->id
            ];
        });

        return response()->json($tokens);
    }

    public function revokeSession(Request $request, $id)
    {
        $token = $request->user()->tokens()->where('id', $id)->first();
        if ($token) {
            $token->delete();
            SessionRevoked::dispatch($request->user()->id, (string)$id);
        }
        return response()->json(['message' => 'Session revoked.']);
    }

    public function logout(Request $request)
    {
        if ($request->user()) {
            $tokenId = $request->user()->currentAccessToken()->id;
            $request->user()->currentAccessToken()->delete();
            SessionRevoked::dispatch($request->user()->id, (string)$tokenId);
        }

        $forgetCookie = cookie()->forget('g4k_refresh_token');

        return response()->json(['message' => 'Logged out.'])->withCookie($forgetCookie);
    }
}
