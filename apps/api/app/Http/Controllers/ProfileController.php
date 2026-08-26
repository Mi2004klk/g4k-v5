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
        return response()->json($request->user()->load(['department', 'designation', 'roleAssignments', 'company']));
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $before = $user->toArray();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'preferences' => 'nullable|array',
            'emergency_contact' => 'nullable|array',
            'emergency_contact.name' => 'required_with:emergency_contact|string|max:255',
            'emergency_contact.phone' => 'required_with:emergency_contact|string|max:20',
            'emergency_contact.relation' => 'required_with:emergency_contact|string|max:50',
        ]);

        if (array_key_exists('emergency_contact', $validated)) {
            $validated['emergency_contact'] = $validated['emergency_contact'] ? json_encode($validated['emergency_contact']) : null;
        }

        $user->update($validated);
        $after = $user->fresh()->toArray();

        AuditLogger::log($request, 'update', 'user', $user->id, $before, $after);

        return response()->json($user->load(['department', 'designation', 'roleAssignments', 'company']));
    }

    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048', // 2MB max
        ]);

        $user = $request->user();

        try {
            // Use S3 (Supabase) Storage for avatars
            $disk = config('filesystems.default');
            $path = $request->file('avatar')->store("avatars/{$request->user()->id}", $disk);

            if (!$path) {
                throw new \Exception('Failed to store file');
            }

            $oldAvatarUrl = $user->avatar_url;

            $avatarUrl = Storage::disk($disk)->url($path);

            $before = $user->toArray();
            $user->avatar_url = $avatarUrl;
            $user->save();

            if ($oldAvatarUrl) {
                try {
                    $oldBasename = basename(parse_url($oldAvatarUrl, PHP_URL_PATH));
                    Storage::disk($disk)->delete('avatars/' . $oldBasename);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning('Failed to delete old avatar: ' . $e->getMessage());
                }
            }

            AuditLogger::log($request, 'upload_avatar', 'user', $user->id, $before, ['avatar_url' => $avatarUrl]);

            return response()->json([
                'url' => $avatarUrl,
                'path' => $path,
                'avatar_url' => $avatarUrl,
                'user' => $user->only(['id', 'first_name', 'last_name', 'avatar_url'])
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Avatar upload failed: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to upload avatar. Please check server storage permissions.'], 500);
        }
    }

}
