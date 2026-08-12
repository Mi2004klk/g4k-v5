<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;
use App\Services\AuditLogger;


use App\Traits\ValidatesPasswordPolicy;

class ProfileController extends Controller
{
    use ValidatesPasswordPolicy;

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
            'preferences' => 'nullable|array',
            'designation_id' => 'nullable|exists:designations,id',
        ]);

        $user->update($validated);
        $after = $user->fresh()->toArray();

        AuditLogger::log($request, 'update', 'user', $user->id, $before, $after);

        if (array_key_exists('designation_id', $validated) && $before['designation_id'] !== $validated['designation_id']) {
            AuditLogger::log($request, 'profile.designation_change', 'user', $user->id, ['designation_id' => $before['designation_id']], ['designation_id' => $validated['designation_id']]);
        }

        return response()->json($user->load(['department', 'designation', 'roleAssignments']));
    }

    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048', // 2MB max
        ]);

        $user = $request->user();
        
        // Use Supabase Storage for avatars
        $path = $request->file('avatar')->store('avatars', 'supabase');
        $avatarUrl = Storage::disk('supabase')->url($path);

        $before = $user->toArray();
        $user->avatar_url = $avatarUrl;
        $user->save();

        AuditLogger::log($request, 'upload_avatar', 'user', $user->id, $before, ['avatar_url' => $avatarUrl]);

        return response()->json(['avatar_url' => $avatarUrl, 'user' => $user]);
    }

}
