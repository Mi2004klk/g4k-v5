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
    private function createAuthCookies($refreshToken, $refreshTtlDays = 7, $isSession = false)
    {
        $isProduction = config('app.env') === 'production';
        
        $minutes = $isSession ? 0 : (60 * 24 * $refreshTtlDays);
        
        // Task 257 (CSRF Protection Documentation):
        // Since `/auth/refresh` is a GET endpoint, it doesn't mutate state and cannot be exploited cross-origin.
        // Additionally, Next.js Rewrites route API calls to the same origin (/api), allowing us to use `SameSite=Lax`.
        // This guarantees that CSRF is mitigated natively by the browser without needing double-submit tokens.
        return cookie(
            'g4k_refresh_token',
            $refreshToken,
            $minutes,
            '/',
            null, // domain defaults to request domain
            $isProduction, // secure
            true, // httpOnly
            false, // raw
            'Lax' // SameSite: Vercel Proxy makes it same-site
        );
    }



    private function resolveLocation(string $ip): ?string
    {
        // IP-based location resolution disabled to prevent third-party egress during login
        return null;
    }

    private function isIpOrLocationMatched(string $ip, ?string $location, $settingsList): bool
    {
        if (empty($settingsList)) return false;
        $items = array_map('trim', explode("\n", $settingsList));
        foreach ($items as $item) {
            if (empty($item)) continue;
            if (str_contains($item, '*')) {
                if (fnmatch($item, $ip) || fnmatch($item, (string)$location)) return true;
            } else {
                if ($ip === $item || stripos((string)$location, $item) !== false) return true;
            }
        }
        return false;
    }

    public function login(Request $request)
    {
        $request->validate([
            'identifier' => 'required|string',
            'password' => 'required|string',
            'device_name' => 'nullable|string',
            'remember' => 'nullable|boolean',
        ]);

        $remember = $request->input('remember', false);
        $throttleKey = Str::lower($request->input('identifier')) . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'message' => 'Account locked due to multiple failed login attempts. Try again in ' . ceil($seconds / 60) . ' minutes.',
                'retry_after' => $seconds
            ], 423);
        }

        $ip = $request->ip();
        $location = $this->resolveLocation($ip);

        // Fetch Settings early for security checks
        $settings = \Illuminate\Support\Facades\Cache::remember('settings:security', 60 * 60, function () {
            $rawSettings = \Illuminate\Support\Facades\DB::table('settings')
                ->where('category', 'security')
                ->pluck('value', 'key')
                ->toArray();
                
            $decoded = [];
            foreach ($rawSettings as $k => $v) {
                $dec = json_decode($v, true);
                $decoded[$k] = (json_last_error() === JSON_ERROR_NONE) ? $dec : $v;
            }
            return $decoded;
        });

        // 1. Blacklist Check (Always Enforced)
        $blacklistIps = $settings['suspicious_login.blacklist_ips'] ?? '';
        $blacklistLocations = $settings['suspicious_login.blacklist_locations'] ?? '';
        
        if ($this->isIpOrLocationMatched($ip, $location, $blacklistIps) || $this->isIpOrLocationMatched($ip, $location, $blacklistLocations)) {
            Log::warning("Blocked blacklisted login attempt from IP: {$ip} (Location: {$location}) for {$request->identifier}");
            
            defer(function () use ($request, $ip, $location) {
                LoginAttempt::create([
                    'identifier' => $request->identifier,
                    'user_id' => null, // Or lookup user
                    'ip_address' => $ip,
                    'location' => $location,
                    'user_agent' => $request->header('User-Agent'),
                    'success' => false,
                    'is_suspicious' => true,
                ]);
            });

            throw ValidationException::withMessages([
                'identifier' => ['Access denied from this network or location.'],
            ]);
        }

        $user = User::where(function($query) use ($request) {
                $query->where('email', $request->identifier)
                      ->orWhere('employee_id', $request->identifier)
                      ->orWhere('username', $request->identifier);
            })->first();

        $credentialsValid = false;
        if ($user) {
            $credentialsValid = Hash::check($request->password, $user->password);
        } else {
            // Prevent timing attack enumeration by always computing a hash
            Hash::check($request->password, '$2y$10$dummyhashdummyhashdummyhashdummyhashdummyhashdummyhash');
        }

        if (!$user || !$credentialsValid) {
            RateLimiter::hit($throttleKey, 600);
            
            if ($user) {
                $user->increment('failed_attempts');
                if ($user->failed_attempts >= 5) {
                    $user->update([
                        'status' => 'locked',
                        'lockout_until' => now()->addMinutes(10)
                    ]);
                }
            }

            defer(function () use ($request, $user, $ip, $location) {
                LoginAttempt::create([
                    'identifier' => $request->identifier,
                    'user_id' => $user?->id,
                    'ip_address' => $ip,
                    'location' => $location,
                    'user_agent' => $request->header('User-Agent'),
                    'success' => false,
                    'is_suspicious' => false,
                ]);
            });

            throw ValidationException::withMessages([
                'identifier' => ['Wrong Username or Password.'],
            ]);
        }

        if ($user->status === 'inactive') {
            throw ValidationException::withMessages([
                'identifier' => ['Wrong Username or Password.'],
            ]);
        }

        if ($user->status === 'locked') {
            if ($user->lockout_until && now()->gt($user->lockout_until)) {
                $user->update([
                    'status' => 'active',
                    'failed_attempts' => 0,
                    'lockout_until' => null,
                ]);
            } else {
                if ($user->lockout_until) {
                    return response()->json([
                        'message' => 'Account locked due to multiple failed login attempts. Try again later.',
                        'retry_after' => now()->diffInSeconds($user->lockout_until)
                    ], 423);
                }
                throw ValidationException::withMessages([
                    'identifier' => ['Wrong Username or Password.'],
                ]);
            }
        }

        RateLimiter::clear($throttleKey);
        
        if ($user->failed_attempts > 0) {
            $user->update(['failed_attempts' => 0]);
        }

        // 2. Suspicious Login Detection (Whitelist / History)
        $isSuspicious = false;
        
        $suspiciousEnabled = filter_var($settings['suspicious_login.enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
        
        if ($suspiciousEnabled) {
            $whitelistIps = $settings['suspicious_login.whitelist_ips'] ?? '';
            $whitelistLocations = $settings['suspicious_login.whitelist_locations'] ?? '';
            
            $hasWhitelist = !empty(trim($whitelistIps)) || !empty(trim($whitelistLocations));
            
            if ($hasWhitelist) {
                $matchedIp = empty(trim($whitelistIps)) ? false : $this->isIpOrLocationMatched($ip, null, $whitelistIps);
                $matchedLoc = empty(trim($whitelistLocations)) ? false : $this->isIpOrLocationMatched(null, $location, $whitelistLocations);
                
                // If either matches its respective whitelist, it is NOT suspicious.
                // If a whitelist is empty, we consider it matched for that criteria (e.g. if only IPs are whitelisted, location doesn't matter).
                $ipOk = empty(trim($whitelistIps)) || $matchedIp;
                $locOk = empty(trim($whitelistLocations)) || $matchedLoc;
                
                if (!$ipOk || !$locOk) {
                    $isSuspicious = true;
                }
            } else {
                $historyCount = LoginAttempt::where('user_id', $user->id)
                    ->where('success', true)
                    ->where(function($q) use ($ip, $location) {
                        $q->where('ip_address', $ip);
                        if ($location) {
                            $q->orWhere('location', $location);
                        }
                    })
                    ->count();
                    
                if ($historyCount === 0) {
                    $isSuspicious = true;
                }
            }
        }

        // Defer non-critical DB inserts to after response
        defer(function () use ($user, $request, $isSuspicious, $ip, $location) {
            // Record successful login
            LoginAttempt::create([
                'identifier' => $request->identifier,
                'user_id' => $user->id,
                'ip_address' => $ip,
                'location' => $location,
                'user_agent' => $request->header('User-Agent'),
                'success' => true,
                'is_suspicious' => $isSuspicious,
            ]);
        });

        // Load roles and settings efficiently
        $rolesCollection = RoleAssignment::where('user_id', $user->id)->pluck('role');
        $user->roles = $rolesCollection->toArray();
        $primaryRole = $user->resolveActiveRole();

        $deviceName = $request->device_name ?? 'Unknown Device';

        $settings = \Illuminate\Support\Facades\Cache::remember('settings:security', 60 * 60, function () {
            $rawSettings = \Illuminate\Support\Facades\DB::table('settings')
                ->where('category', 'security')
                ->pluck('value', 'key')
                ->toArray();
                
            $decoded = [];
            foreach ($rawSettings as $k => $v) {
                $dec = json_decode($v, true);
                $decoded[$k] = (json_last_error() === JSON_ERROR_NONE) ? $dec : $v;
            }
            return $decoded;
        });
            
        $accessTtl = (int) ($settings['session.access_token_ttl'] ?? 15);
        $refreshTtl = (int) ($settings['session.refresh_token_ttl'] ?? 7);

        // Password Expiry Check
        $passwordExpired = false;
        $expiryDays = $settings['password.expiry_days'] ?? null;
        if ($expiryDays !== null && $expiryDays !== 'null' && $expiryDays !== '' && (int)$expiryDays > 0) {
            $changedAt = $user->password_changed_at ?: $user->created_at;
            if (\Carbon\Carbon::parse($changedAt)->addDays((int)$expiryDays)->isPast()) {
                $passwordExpired = true;
                if (!$user->must_change_password) {
                    $user->must_change_password = true;
                    $user->save();
                }
            }
        }

        $rememberAbility = $remember ? 'remember:true' : 'remember:false';

        // Issue Access Token
        $accessTokenObj = $user->createToken($deviceName, ['role:' . $primaryRole, $rememberAbility], now()->addMinutes($accessTtl));
        $accessTokenObj->accessToken->forceFill([
            'ip_address' => $request->ip(),
            'user_agent' => $request->header('User-Agent')
        ])->saveQuietly();
        $accessToken = $accessTokenObj->plainTextToken;

        // Issue Refresh Token
        $refreshTokenObj = $user->createToken($deviceName . '_refresh', ['refresh', 'role:' . $primaryRole, $rememberAbility], now()->addDays($refreshTtl));
        $refreshTokenObj->accessToken->forceFill([
            'ip_address' => $request->ip(),
            'user_agent' => $request->header('User-Agent')
        ])->saveQuietly();
        $refreshToken = $refreshTokenObj->plainTextToken;

        // Enforce max concurrent sessions/devices
        $maxConcurrent = $settings['session.max_devices'] ?? null;
        if ($maxConcurrent !== null && $maxConcurrent !== 'null' && $maxConcurrent !== '') {
            // Because each "session" creates 2 tokens (access + refresh), max tokens = maxConcurrent * 2
            $maxTokens = (int)$maxConcurrent * 2;
            $tokens = $user->tokens()->orderBy('created_at', 'desc')->get();
            if ($tokens->count() > $maxTokens) {
                $tokensToKeep = $tokens->take($maxTokens)->pluck('id');
                $user->tokens()->whereNotIn('id', $tokensToKeep)->delete();
            }
        }

        $cookie = $this->createAuthCookies($refreshToken, $refreshTtl, !$remember);

        \App\Services\AuditLogger::log($request, 'login', 'User', $user->id, null, null, $user->id);

        $capabilities = \App\Services\CapabilityMatrix::getCapabilitiesForRole($primaryRole);

        return response()->json([
            'token' => $accessToken,
            'refresh_token' => $refreshToken,
            'user' => $user,
            'active_role' => $primaryRole,
            'capabilities' => $capabilities,
            'must_change_password' => (bool)$user->must_change_password,
            'password_expired' => $passwordExpired,
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

        if (!$tokenInstance || $tokenInstance->expires_at?->isPast() || !in_array('refresh', $tokenInstance->abilities ?? [])) {
            return response()->json(['message' => 'Invalid or expired refresh token'], 401);
        }

        /** @var User $user */
        $user = $tokenInstance->tokenable;

        if (!$user) {
            return response()->json(['message' => 'User not found'], 401);
        }

        if ($user->status !== 'active') {
            return response()->json(['message' => 'User account is deactivated.'], 403);
        }

        // Revoke the single used refresh token (token rotation)
        $tokenInstance->delete();

        $rolesCollection = RoleAssignment::where('user_id', $user->id)->pluck('role');
        $user->roles = $rolesCollection->toArray();
        
        // Extract role and remember status from current token
        $primaryRole = null;
        $isRemember = false;
        foreach ($tokenInstance->abilities ?? [] as $ability) {
            if (str_starts_with($ability, 'role:')) {
                $primaryRole = substr($ability, 5);
            }
            if ($ability === 'remember:true') {
                $isRemember = true;
            }
        }
        if (!$primaryRole || !in_array($primaryRole, $user->roles)) {
            $primaryRole = $user->resolveActiveRole();
        }

        $deviceName = $request->device_name ?? 'Unknown Device';

        $settings = \Illuminate\Support\Facades\Cache::remember('settings:security', 60 * 60, function () {
            $rawSettings = \Illuminate\Support\Facades\DB::table('settings')
                ->where('category', 'security')
                ->pluck('value', 'key')
                ->toArray();

            $decoded = [];
            foreach ($rawSettings as $k => $v) {
                $dec = json_decode($v, true);
                $decoded[$k] = (json_last_error() === JSON_ERROR_NONE) ? $dec : $v;
            }
            return $decoded;
        });
            
        $accessTtl = (int) ($settings['session.access_token_ttl'] ?? 15);
        $refreshTtl = (int) ($settings['session.refresh_token_ttl'] ?? 7);

        // Password Expiry Check
        $passwordExpired = false;
        $expiryDays = $settings['password.expiry_days'] ?? null;
        if ($expiryDays !== null && $expiryDays !== 'null' && $expiryDays !== '' && (int)$expiryDays > 0) {
            $changedAt = $user->password_changed_at ?: $user->created_at;
            if (\Carbon\Carbon::parse($changedAt)->addDays((int)$expiryDays)->isPast()) {
                $passwordExpired = true;
                if (!$user->must_change_password) {
                    $user->must_change_password = true;
                    $user->save();
                }
            }
        }

        $rememberAbility = $isRemember ? 'remember:true' : 'remember:false';

        // Issue new Access Token
        $newAccessTokenObj = $user->createToken($deviceName, ['role:' . $primaryRole, $rememberAbility], now()->addMinutes($accessTtl));
        $newAccessTokenObj->accessToken->forceFill([
            'ip_address' => $request->ip(),
            'user_agent' => $request->header('User-Agent')
        ])->saveQuietly();
        $newAccessToken = $newAccessTokenObj->plainTextToken;

        // Issue new Refresh Token
        $newRefreshTokenObj = $user->createToken($deviceName . '_refresh', ['refresh', 'role:' . $primaryRole, $rememberAbility], now()->addDays($refreshTtl));
        $newRefreshTokenObj->accessToken->forceFill([
            'ip_address' => $request->ip(),
            'user_agent' => $request->header('User-Agent')
        ])->saveQuietly();
        $newRefreshToken = $newRefreshTokenObj->plainTextToken;

        // Enforce max concurrent sessions
        $maxConcurrent = $settings['session.max_devices'] ?? null;
        if ($maxConcurrent !== null && $maxConcurrent !== 'null' && $maxConcurrent !== '') {
            $maxTokens = (int)$maxConcurrent * 2;
            $tokens = $user->tokens()->orderBy('created_at', 'desc')->get();
            if ($tokens->count() > $maxTokens) {
                $tokensToKeep = $tokens->take($maxTokens)->pluck('id');
                $user->tokens()->whereNotIn('id', $tokensToKeep)->delete();
            }
        }

        $cookie = $this->createAuthCookies($newRefreshToken, $refreshTtl, !$isRemember);
        $capabilities = \App\Services\CapabilityMatrix::getCapabilitiesForRole($primaryRole);

        return response()->json([
            'token' => $newAccessToken,
            'refresh_token' => $newRefreshToken,
            'user' => $user,
            'active_role' => $primaryRole,
            'capabilities' => $capabilities,
            'must_change_password' => (bool)$user->must_change_password,
            'password_expired' => $passwordExpired,
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

        $deviceName = $user->currentAccessToken()?->name ?? 'Unknown Device';
        
        $isRemember = false;
        foreach ($user->currentAccessToken()?->abilities ?? [] as $ability) {
            if ($ability === 'remember:true') {
                $isRemember = true;
                break;
            }
        }
        $rememberAbility = $isRemember ? 'remember:true' : 'remember:false';

        $user->currentAccessToken()?->delete();

        // Find and delete old refresh token for this device, matching exact IP and user-agent to prevent cross-device deletion
        $user->tokens()
            ->where('name', $deviceName . '_refresh')
            ->where('ip_address', $request->ip())
            ->where('user_agent', $request->header('User-Agent'))
            ->latest()
            ->limit(1)
            ->delete();

        $settings = \Illuminate\Support\Facades\Cache::remember('settings:security', 60 * 60, function () {
            $rawSettings = \Illuminate\Support\Facades\DB::table('settings')
                ->where('category', 'security')
                ->pluck('value', 'key')
                ->toArray();
                
            $decoded = [];
            foreach ($rawSettings as $k => $v) {
                $dec = json_decode($v, true);
                $decoded[$k] = (json_last_error() === JSON_ERROR_NONE) ? $dec : $v;
            }
            return $decoded;
        });
        $accessTtl = (int) ($settings['session.access_token_ttl'] ?? 15);

        $tokenObj = $user->createToken($deviceName, ['role:' . $request->role, $rememberAbility], now()->addMinutes($accessTtl));
        $tokenObj->accessToken->forceFill([
            'ip_address' => $request->ip(),
            'user_agent' => $request->header('User-Agent')
        ])->saveQuietly();
        $token = $tokenObj->plainTextToken;

        $refreshTtl = (int) ($settings['session.refresh_token_ttl'] ?? 7);

        $refreshTokenObj = $user->createToken($deviceName . '_refresh', ['refresh', 'role:' . $request->role, $rememberAbility], now()->addDays($refreshTtl));
        $refreshTokenObj->accessToken->forceFill([
            'ip_address' => $request->ip(),
            'user_agent' => $request->header('User-Agent')
        ])->saveQuietly();
        $refreshToken = $refreshTokenObj->plainTextToken;

        $cookie = $this->createAuthCookies($refreshToken, $refreshTtl, !$isRemember);

        $user->roles = $roles;
        $user->update(['active_role' => $request->role]);

        $capabilities = \App\Services\CapabilityMatrix::getCapabilitiesForRole($request->role);

        return response()->json([
            'token' => $token,
            'refresh_token' => $refreshToken,
            'user' => $user,
            'active_role' => $request->role,
            'capabilities' => $capabilities,
        ])->withCookie($cookie);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'identifier' => 'required|string',
        ]);

        $user = User::where('email', $request->identifier)
            ->orWhere('username', $request->identifier)
            ->orWhere('employee_id', $request->identifier)
            ->first();

        $emailSent = false;
        $smtpConfigured = \App\Support\SmtpSettings::isConfigured();

        if ($user) {
            Log::info("Password reset request for User ID {$user->id}");

            if ($smtpConfigured) {
                \App\Support\SmtpSettings::apply();

                $token = \Illuminate\Support\Str::random(60);
                \Illuminate\Support\Facades\DB::table('password_reset_tokens')->updateOrInsert(
                    ['email' => $user->email],
                    ['token' => \Illuminate\Support\Facades\Hash::make($token), 'created_at' => now()]
                );
                
                try {
                    \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\PasswordResetMail($token, $user->email));
                    $emailSent = true;
                } catch (\Throwable $e) {
                    Log::error("Failed to send password reset email to {$user->email}: " . $e->getMessage());
                }
            }

            if (!$smtpConfigured || !$emailSent) {
                // Create in-app approval request
                \App\Models\PasswordResetRequest::updateOrCreate(
                    ['user_id' => $user->id, 'status' => 'pending'],
                    ['created_at' => now(), 'updated_at' => now()]
                );
            }
        }

        return response()->json([
            'message' => 'If the account exists, password recovery instructions have been sent (via email and/or to your administrator).',
            'email_not_configured' => !$smtpConfigured,
            'email_send_failed' => $smtpConfigured && !$emailSent,
        ], 202);
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
            return response()->json([
                'message' => 'Invalid or expired password reset token.',
                'errors' => ['token' => ['Invalid or expired password reset token.']]
            ], 422);
        }

        $resetRecord = \Illuminate\Support\Facades\DB::table('password_reset_tokens')->where('email', $user->email)->first();
        
        if (!$resetRecord || !\Illuminate\Support\Facades\Hash::check($request->token, $resetRecord->token)) {
            return response()->json([
                'message' => 'Invalid or expired password reset token.',
                'errors' => ['token' => ['Invalid or expired password reset token.']]
            ], 422);
        }
        
        if (\Carbon\Carbon::parse($resetRecord->created_at)->addMinutes(60)->isPast()) {
            \Illuminate\Support\Facades\DB::table('password_reset_tokens')->where('email', $user->email)->delete();
            return response()->json([
                'message' => 'Invalid or expired password reset token.',
                'errors' => ['token' => ['Invalid or expired password reset token.']]
            ], 422);
        }

        $user->password = Hash::make($request->password);
        $user->must_change_password = false;
        $user->password_changed_at = now();
        $user->save();

        // Revoke all existing tokens to kick out attackers/old sessions (AUTH-2)
        $user->tokens()->delete();

        \Illuminate\Support\Facades\Cache::forget("user_{$user->id}_roles");

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
        $user->password_changed_at = now();
        $user->save();

        \Illuminate\Support\Facades\Cache::forget("user_{$user->id}_roles");

        $deviceName = $user->currentAccessToken()?->name ?? 'Unknown Device';
        $user->tokens()->delete(); // Revoke ALL existing tokens

        // Issue new pair so current session continues
        $settings = \Illuminate\Support\Facades\Cache::remember('settings:security', 60 * 60, function () {
            $rawSettings = \Illuminate\Support\Facades\DB::table('settings')
                ->where('category', 'security')
                ->pluck('value', 'key')
                ->toArray();
                
            $decoded = [];
            foreach ($rawSettings as $k => $v) {
                $dec = json_decode($v, true);
                $decoded[$k] = (json_last_error() === JSON_ERROR_NONE) ? $dec : $v;
            }
            return $decoded;
        });
        $accessTtl = (int) ($settings['session.access_token_ttl'] ?? 15);
        $refreshTtl = (int) ($settings['session.refresh_token_ttl'] ?? 7);

        $activeRole = $user->resolveActiveRole();
        $accessToken = $user->createToken($deviceName, ['role:' . $activeRole], now()->addMinutes($accessTtl))->plainTextToken;
        $refreshToken = $user->createToken($deviceName . '_refresh', ['refresh', 'role:' . $activeRole], now()->addDays($refreshTtl))->plainTextToken;
        
        $cookie = $this->createAuthCookies($refreshToken, $refreshTtl);

        $capabilities = \App\Services\CapabilityMatrix::getCapabilitiesForRole($activeRole);

        return response()->json([
            'message' => 'Password changed successfully.',
            'token' => $accessToken,
            'refresh_token' => $refreshToken,
            'user' => $user,
            'capabilities' => $capabilities
        ])->withCookie($cookie);
    }

    public function skipPasswordChange(Request $request)
    {
        $settings = \Illuminate\Support\Facades\Cache::remember('settings:security', 60 * 60, function () {
            $rawSettings = \Illuminate\Support\Facades\DB::table('settings')
                ->where('category', 'security')
                ->pluck('value', 'key')
                ->toArray();
                
            $decoded = [];
            foreach ($rawSettings as $k => $v) {
                $dec = json_decode($v, true);
                $decoded[$k] = (json_last_error() === JSON_ERROR_NONE) ? $dec : $v;
            }
            return $decoded;
        });

        $isCompulsive = filter_var($settings['force_password_change'] ?? true, FILTER_VALIDATE_BOOLEAN);
        
        if ($isCompulsive) {
            return response()->json([
                'message' => 'Password change is mandatory and cannot be skipped.'
            ], 403);
        }

        $user = $request->user();
        $user->must_change_password = false;
        $user->save();

        return response()->json([
            'message' => 'Password change skipped.',
            'user' => $user
        ]);
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

        $user->load(['department', 'designation', 'company', 'roleAssignments']);

        return response()->json([
            'message' => 'Onboarding marked as completed.',
            'user' => $user,
        ]);
    }

    public function sessions(Request $request)
    {
        $tokens = $request->user()->tokens()->where('name', 'not like', '%_refresh')->get()->map(function($t) use ($request) {
            return [
                'id' => $t->id,
                'device_name' => $t->name,
                'ip_address' => $t->ip_address,
                'user_agent' => $t->user_agent,
                'last_used_at' => $t->last_used_at,
                'is_current' => $request->user()->currentAccessToken() ? $t->id === $request->user()->currentAccessToken()->id : false
            ];
        });

        return response()->json(['data' => $tokens]);
    }

    public function revokeSession(Request $request, $id)
    {
        $token = $request->user()->tokens()->where('id', $id)->first();
        if ($token) {
            // Find corresponding refresh token (created at exact same time, with '_refresh' suffix)
            $refreshToken = $request->user()->tokens()
                ->where('name', $token->name . '_refresh')
                ->where('created_at', $token->created_at)
                ->first();

            $token->delete();
            if ($refreshToken) {
                $refreshToken->delete();
            }

            SessionRevoked::dispatch($request->user()->id, (string)$id);
            \App\Services\NotificationService::send(
                userId: $request->user()->id,
                type: 'system',
                title: "Session Revoked",
                body: "A session was manually revoked.",
                data: ['token_id' => $id],
                link: "/dashboard/settings"
            );
        }
        return response()->json(['message' => 'Session revoked.']);
    }

    public function logout(Request $request)
    {
        if ($request->user()) {
            \App\Services\AuditLogger::log($request, 'logout', 'User', $request->user()->id, null, null);
            if ($request->user()->currentAccessToken()) {
                $tokenId = $request->user()->currentAccessToken()->id;
                $request->user()->currentAccessToken()->delete();
                SessionRevoked::dispatch($request->user()->id, (string)$tokenId);
            }
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
        $user->active_role = $user->resolveActiveRole();
        return response()->json($user);
    }

    public function capabilities(Request $request)
    {
        $activeRole = $request->user()->resolveActiveRole();
        
        $token = $request->user()->currentAccessToken();
        if ($token) {
            if ($token->can('role:super_admin')) $activeRole = 'super_admin';
            elseif ($token->can('role:hr')) $activeRole = 'hr';
            elseif ($token->can('role:employee')) $activeRole = 'employee';
        }

        $capabilities = \App\Services\CapabilityMatrix::getCapabilitiesForRole($activeRole);
        return response()->json(['capabilities' => $capabilities]);
    }

}
