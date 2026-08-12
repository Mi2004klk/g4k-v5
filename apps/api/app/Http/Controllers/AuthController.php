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
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Cookie;

use App\Traits\ValidatesPasswordPolicy;

class AuthController extends Controller
{
    use ValidatesPasswordPolicy;
    private function createAuthCookies($refreshToken, $refreshTtlDays = 7)
    {
        $isProduction = config('app.env') === 'production';
        
        // Task 257 (CSRF Protection Documentation):
        // Since `/auth/refresh` is a GET endpoint, it doesn't mutate state and cannot be exploited cross-origin.
        // Additionally, Next.js Rewrites route API calls to the same origin (/api), allowing us to use `SameSite=Lax`.
        // This guarantees that CSRF is mitigated natively by the browser without needing double-submit tokens.
        return cookie(
            'g4k_refresh_token',
            $refreshToken,
            60 * 24 * $refreshTtlDays, // Dynamic days in minutes
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

        $user = User::where('status', 'active')
            ->where(function($query) use ($request) {
                $query->where('email', $request->identifier)
                      ->orWhere('employee_id', $request->identifier)
                      ->orWhere('username', $request->identifier);
            })->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            RateLimiter::hit($throttleKey, 600);

            defer(function () use ($request, $user) {
                LoginAttempt::create([
                    'identifier' => $request->identifier,
                    'user_id' => $user?->id,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->header('User-Agent'),
                    'success' => false,
                    'is_suspicious' => false,
                ]);
            });

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
        $lastIpBinary = $lastSuccessfulLogin ? inet_pton($lastSuccessfulLogin->ip_address) : false;
        $currentIpBinary = inet_pton($request->ip());
        
        if ($lastSuccessfulLogin && $lastIpBinary !== false && $currentIpBinary !== false && $lastIpBinary !== $currentIpBinary) {
            $isSuspicious = true;
            
            defer(function () use ($user, $request, $lastSuccessfulLogin) {
                Log::warning("Suspicious login detected for User ID {$user->id} ({$user->email}) from IP {$request->ip()} (previous: {$lastSuccessfulLogin->ip_address})");
                
                $adminIds = RoleAssignment::whereIn('role', ['super_admin', 'hr'])->pluck('user_id')->unique();
                foreach ($adminIds as $adminId) {
                    \App\Models\Notification::create([
                        'user_id' => $adminId,
                        'title' => 'Suspicious Login Detected',
                        'body' => "User {$user->name} ({$user->email}) logged in from a new IP: {$request->ip()} (User-Agent: {$request->header('User-Agent')}).",
                        'type' => 'security',
                        'priority' => 'urgent'
                    ]);
                }
            });
        }

        // Defer non-critical DB inserts to after response
        defer(function () use ($user, $request, $isSuspicious) {
            // Record successful login
            LoginAttempt::create([
                'identifier' => $request->identifier,
                'user_id' => $user->id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->header('User-Agent'),
                'success' => true,
                'is_suspicious' => $isSuspicious,
            ]);
        });

        // Load roles and settings efficiently
        $rolesCollection = RoleAssignment::where('user_id', $user->id)->pluck('role');
        $user->roles = $rolesCollection->toArray();
        $primaryRole = $user->active_role ?? $rolesCollection->first() ?? 'employee';

        $deviceName = $request->device_name ?? 'Unknown Device';

        $settings = \Illuminate\Support\Facades\Cache::remember('settings:security', 60 * 60, function () {
            return \Illuminate\Support\Facades\DB::table('settings')
                ->where('category', 'security')
                ->pluck('value', 'key')
                ->toArray();
        });
            
        $accessTtl = (int) ($settings['session.access_token_ttl'] ?? 15);
        $refreshTtl = (int) ($settings['session.refresh_token_ttl'] ?? 7);

        // Issue Access Token
        $accessTokenObj = $user->createToken($deviceName, ['role:' . $primaryRole], now()->addMinutes($accessTtl));
        $accessTokenObj->accessToken->forceFill([
            'ip_address' => $request->ip()
        ])->saveQuietly();
        $accessToken = $accessTokenObj->plainTextToken;

        // Issue Refresh Token
        $refreshTokenObj = $user->createToken($deviceName . '_refresh', ['refresh'], now()->addDays($refreshTtl));
        $refreshTokenObj->accessToken->forceFill([
            'ip_address' => $request->ip()
        ])->saveQuietly();
        $refreshToken = $refreshTokenObj->plainTextToken;

        $cookie = $this->createAuthCookies($refreshToken, $refreshTtl);

        \App\Services\AuditLogger::log($request, 'login', 'User', $user->id, null, null);

        return response()->json([
            'token' => $accessToken,
            'refresh_token' => $refreshToken,
            'user' => $user,
            'active_role' => $primaryRole,
            'must_change_password' => (bool)$user->must_change_password,
            'onboarded' => !is_null($user->onboarded_at),
        ])->withCookie($cookie);
    }

    public function refresh(Request $request)
    {
        $rawRefreshToken = $request->cookie('g4k_refresh_token')
            ?? $request->header('X-Refresh-Token')
            ?? $request->input('refresh_token');

        if (!$rawRefreshToken) {
            return response()->json(['message' => 'Unauthenticated (No refresh token provided)'], 401);
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

        // AUTH-8: Explicitly run the onboarding checks inside refresh
        if (is_null($user->onboarded_at)) {
            return response()->json(['message' => 'You must complete onboarding before continuing.', 'onboarding_required' => true], 403);
        }

        // Revoke old refresh token (Token Rotation)
        $tokenInstance->delete();

        $rolesCollection = RoleAssignment::where('user_id', $user->id)->pluck('role');
        $user->roles = $rolesCollection->toArray();
        $primaryRole = $user->active_role ?? $rolesCollection->first() ?? 'employee';

        // Issue new pair
        $newAccessTokenObj = $user->createToken('Refreshed Session', ['role:' . $primaryRole]);
        $newAccessTokenObj->accessToken->forceFill([
            'ip_address' => $request->ip(),
            'expires_at' => now()->addMinutes(15)
        ])->save();
        $newAccessToken = $newAccessTokenObj->plainTextToken;

        $newRefreshTokenObj = $user->createToken('Refreshed Session_refresh', ['refresh']);
        $newRefreshTokenObj->accessToken->forceFill([
            'ip_address' => $request->ip(),
            'expires_at' => now()->addDays(7)
        ])->save();
        $newRefreshToken = $newRefreshTokenObj->plainTextToken;

        $cookie = $this->createAuthCookies($newRefreshToken);

        return response()->json([
            'token' => $newAccessToken,
            'refresh_token' => $newRefreshToken,
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
        $user->active_role = $request->role;
        $user->save();

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
            
            if ($request->channel === 'admin') {
                \App\Models\PasswordResetRequest::create([
                    'user_id' => $user->id,
                    'status' => 'pending'
                ]);

                $adminIds = RoleAssignment::where('role', 'super_admin')->pluck('user_id')->unique();
                foreach ($adminIds as $adminId) {
                    \App\Models\Notification::create([
                        'user_id' => $adminId,
                        'title' => 'Password Reset Requested',
                        'body' => "User {$user->name} ({$user->email}) requested a password reset.",
                        'type' => 'security',
                        'priority' => 'normal',
                    ]);
                }
            } elseif ($request->channel === 'smtp') {
                $token = \Illuminate\Support\Str::random(60);
                \Illuminate\Support\Facades\DB::table('password_reset_tokens')->updateOrInsert(
                    ['email' => $user->email],
                    ['token' => \Illuminate\Support\Facades\Hash::make($token), 'created_at' => now()]
                );
                
                try {
                    \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\PasswordResetMail($token, $user->email));
                } catch (\Exception $e) {
                    Log::error("Failed to send password reset email to {$user->email}: " . $e->getMessage());
                }
            }
        }

        return response()->json(['message' => 'If the account exists, password recovery instructions have been sent.'], 202);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'identifier' => 'required|string',
            'password' => ['required', 'string', 'confirmed', $this->getPasswordPolicyRule()],
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

        $resetRecord = \Illuminate\Support\Facades\DB::table('password_reset_tokens')->where('email', $user->email)->first();
        
        if (!$resetRecord || !\Illuminate\Support\Facades\Hash::check($request->token, $resetRecord->token)) {
            throw ValidationException::withMessages([
                'token' => ['Invalid or expired password reset token.'],
            ]);
        }
        
        if (\Carbon\Carbon::parse($resetRecord->created_at)->addMinutes(60)->isPast()) {
            \Illuminate\Support\Facades\DB::table('password_reset_tokens')->where('email', $user->email)->delete();
            throw ValidationException::withMessages([
                'token' => ['Invalid or expired password reset token.'],
            ]);
        }

        $user->password = Hash::make($request->password);
        $user->must_change_password = false;
        $user->save();

        // Revoke all existing tokens to kick out attackers/old sessions (AUTH-2)
        $user->tokens()->delete();

        \Illuminate\Support\Facades\DB::table('password_reset_tokens')->where('email', $user->email)->delete();

        return response()->json(['message' => 'Password reset successful.']);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => ['required', 'string', 'confirmed', $this->getPasswordPolicyRule()],
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

        $deviceName = $user->currentAccessToken()->name ?? 'Unknown Device';
        $user->tokens()->delete(); // Revoke ALL existing tokens

        // Issue new pair so current session continues
        $settings = \Illuminate\Support\Facades\Cache::remember('settings:security', 60 * 60, function () {
            return \Illuminate\Support\Facades\DB::table('settings')->where('category', 'security')->pluck('value', 'key')->toArray();
        });
        $accessTtl = (int) ($settings['session.access_token_ttl'] ?? 15);
        $refreshTtl = (int) ($settings['session.refresh_token_ttl'] ?? 7);

        $activeRole = $user->active_role ?? 'employee';
        $accessToken = $user->createToken($deviceName, ['role:' . $activeRole], now()->addMinutes($accessTtl))->plainTextToken;
        $refreshToken = $user->createToken($deviceName . '_refresh', ['refresh'], now()->addDays($refreshTtl))->plainTextToken;
        
        $cookie = $this->createAuthCookies($refreshToken, $refreshTtl);

        return response()->json([
            'message' => 'Password changed successfully.',
            'token' => $accessToken,
            'refresh_token' => $refreshToken,
            'user' => $user
        ])->withCookie($cookie);
    }

    public function completeOnboarding(Request $request)
    {
        $request->validate([
            'phone' => 'nullable|string|max:20',
            'emergency_contact' => 'nullable|string|max:20',
        ]);

        $user = $request->user();
        
        if ($request->filled('phone')) {
            $user->phone = $request->phone;
        }
        if ($request->filled('emergency_contact')) {
            $user->emergency_contact = $request->emergency_contact;
        }

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
            \App\Services\AuditLogger::log($request, 'logout', 'User', $request->user()->id, null, null);
            $tokenId = $request->user()->currentAccessToken()->id;
            $request->user()->currentAccessToken()->delete();
            SessionRevoked::dispatch($request->user()->id, (string)$tokenId);
        }

        $rawRefreshToken = $request->cookie('g4k_refresh_token') ?? $request->header('X-Refresh-Token');
        if ($rawRefreshToken) {
            $tokenInstance = \Laravel\Sanctum\PersonalAccessToken::findToken($rawRefreshToken);
            if ($tokenInstance) {
                $tokenInstance->delete();
            }
        }

        $forgetCookie = cookie()->forget('g4k_refresh_token');

        return response()->json(['message' => 'Logged out.'])->withCookie($forgetCookie);
    }

    public function profile(Request $request)
    {
        $user = $request->user()->load(['department', 'designation', 'company', 'roleAssignments']);
        $activeRole = $request->user()->currentAccessToken()->abilities[0] ?? 'employee';
        $user->active_role = str_replace('role:', '', $activeRole);
        return response()->json($user);
    }

    public function capabilities(Request $request)
    {
        $activeRole = $request->user()->currentAccessToken()->abilities[0] ?? 'employee';
        $activeRole = str_replace('role:', '', $activeRole);
        $capabilities = \App\Services\CapabilityMatrix::getCapabilitiesForRole($activeRole);
        return response()->json(['capabilities' => $capabilities]);
    }
}
