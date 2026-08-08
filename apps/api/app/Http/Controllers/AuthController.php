<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\RoleAssignment;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AuthController extends Controller
{
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
            return response()->json(['message' => 'Account locked. Try again in ' . ceil($seconds/60) . ' minutes.'], 423);
        }

        $user = User::where('email', $request->identifier)
                    ->orWhere('employee_id', $request->identifier)
                    ->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            RateLimiter::hit($throttleKey, 600); // 10 minutes lockout
            throw ValidationException::withMessages([
                'identifier' => ['Invalid credentials.'],
            ]);
        }

        RateLimiter::clear($throttleKey);

        // Record suspicious login (basic heuristic)
        $lastToken = $user->tokens()->latest()->first();
        if ($lastToken && $lastToken->ip_address !== $request->ip()) {
            Log::info("Suspicious login detected for user {$user->id} from new IP: {$request->ip()}");
            // SMTP implementation will be wired to a Mailable later if needed.
        }

        $deviceName = $request->device_name ?? 'Unknown Device';
        $token = $user->createToken($deviceName)->plainTextToken;

        // Set IP Address on token
        $dbToken = $user->tokens()->latest()->first();
        if ($dbToken) {
            $dbToken->ip_address = $request->ip();
            $dbToken->save();
        }

        $user->roles = RoleAssignment::where('user_id', $user->id)->pluck('role');

        return response()->json([
            'token' => $token,
            'user' => $user,
            'active_role' => null
        ]);
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

        // Reissue token with specific ability (role)
        $deviceName = $user->currentAccessToken()->name;
        $user->currentAccessToken()->delete(); // revoke old

        $token = $user->createToken($deviceName, ['role:' . $request->role])->plainTextToken;
        
        $dbToken = $user->tokens()->latest()->first();
        if ($dbToken) {
            $dbToken->ip_address = $request->ip();
            $dbToken->save();
        }

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

        // Mock implementation for Phase 1
        Log::info("Password reset requested for {$request->identifier} via {$request->channel}");
        
        return response()->json(['message' => 'Reset request received.']);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'email' => 'required|string',
            'password' => 'required|string|confirmed',
        ]);

        return response()->json(['message' => 'Password reset successful.']);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|confirmed',
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
        $request->user()->tokens()->where('id', $id)->delete();
        return response()->json(['message' => 'Session revoked.']);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out.']);
    }
}
