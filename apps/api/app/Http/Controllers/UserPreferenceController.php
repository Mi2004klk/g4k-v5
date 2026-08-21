<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class UserPreferenceController extends Controller
{
    public function show(Request $request)
    {
        try {
            $user = $request->user();
            $prefs = $user->preferences ?? [];
            return response()->json([
                'theme_mode' => $prefs['theme_mode'] ?? 'system',
                'density' => $prefs['density'] ?? 'comfortable',
                'preferences' => $prefs
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('User preference fetch failed: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return response()->json([
                'error' => 'An error occurred while fetching preferences'
            ], 500);
        }
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'theme_mode' => 'nullable|in:light,dark,system',
            'density' => 'nullable|in:compact,comfortable',
            'directory_visibility' => 'nullable|in:public,internal,private',
            'preferences' => 'nullable|array'
        ]);

        $user = $request->user();
        $prefs = $user->preferences ?? [];
        
        if (isset($validated['theme_mode'])) {
            $prefs['theme_mode'] = $validated['theme_mode'];
        }
        
        if (isset($validated['density'])) {
            $prefs['density'] = $validated['density'];
        }

        if (isset($validated['directory_visibility'])) {
            $prefs['directory_visibility'] = $validated['directory_visibility'];
        }

        if (isset($validated['preferences'])) {
            $incomingPrefs = $validated['preferences'];
            if (isset($incomingPrefs['directory_visibility']) && !in_array($incomingPrefs['directory_visibility'], ['public', 'internal', 'private'])) {
                unset($incomingPrefs['directory_visibility']);
            }
            $prefs = array_merge($prefs, $incomingPrefs);
        }
        
        $user->preferences = $prefs;
        $user->save();

        \Illuminate\Support\Facades\Cache::forget("user_prefs_{$user->id}");

        return response()->json([
            'theme_mode' => $prefs['theme_mode'] ?? 'system',
            'density' => $prefs['density'] ?? 'comfortable',
            'preferences' => $prefs
        ]);
    }
}
