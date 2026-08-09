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
            return response()->json([
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
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
            $prefs = array_merge($prefs, $validated['preferences']);
        }
        
        $user->preferences = $prefs;
        $user->save();

        return response()->json([
            'theme_mode' => $prefs['theme_mode'] ?? 'system',
            'density' => $prefs['density'] ?? 'comfortable',
            'preferences' => $prefs
        ]);
    }
}
