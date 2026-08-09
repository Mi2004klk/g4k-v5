<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use App\Services\AuditLogger;

class ProfileController extends Controller
{
    public function __construct()
    {
        $this->middleware('capability:profile.edit');
    }

    public function show(Request $request)
    {
        return response()->json($request->user()->load(['department', 'designation', 'roleAssignments']));
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $before = $user->toArray();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'avatar_url' => 'nullable|string',
        ]);

        $user->update($validated);

        AuditLogger::log($request, 'update', 'user', $user->id, $before, $user->fresh()->toArray());

        return response()->json($user);
    }

    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048', // 2MB max
        ]);

        $user = $request->user();
        $path = $request->file('avatar')->store('avatars', 'public');
        $avatarUrl = Storage::url($path);

        $before = $user->toArray();
        $user->avatar_url = $avatarUrl;
        $user->save();

        AuditLogger::log($request, 'upload_avatar', 'user', $user->id, $before, ['avatar_url' => $avatarUrl]);

        return response()->json(['avatar_url' => $avatarUrl, 'user' => $user]);
    }

    public function changePassword(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json(['message' => 'Current password is incorrect'], 422);
        }

        $user->update([
            'password' => Hash::make($validated['new_password']),
            'must_change_password' => false,
        ]);

        AuditLogger::log($request, 'change_password', 'user', $user->id, null, null);

        return response()->json(['message' => 'Password changed successfully']);
    }
}
