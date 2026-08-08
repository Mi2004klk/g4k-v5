<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return response()->json($request->user()->load(['department', 'designation']));
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'avatar_url' => 'nullable|url',
        ]);

        $user->update($validated);

        return response()->json($user);
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

        return response()->json(['message' => 'Password changed successfully']);
    }
}
