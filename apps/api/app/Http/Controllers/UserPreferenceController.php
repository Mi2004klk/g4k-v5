<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class UserPreferenceController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'theme_mode' => $user->theme_mode ?? 'system',
            'density' => $user->density ?? 'comfortable',
            'preferences' => $user->preferences ?? []
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'theme_mode' => 'nullable|in:light,dark,system',
            'density' => 'nullable|in:compact,comfortable',
            'preferences' => 'nullable|array'
        ]);

        $user = $request->user();
        
        if (isset($validated['theme_mode'])) {
            $user->theme_mode = $validated['theme_mode'];
        }
        
        if (isset($validated['density'])) {
            $user->density = $validated['density'];
        }

        if (isset($validated['preferences'])) {
            $current = $user->preferences ?? [];
            $user->preferences = array_merge($current, $validated['preferences']);
        }
        
        $user->save();

        return response()->json([
            'theme_mode' => $user->theme_mode,
            'density' => $user->density,
            'preferences' => $user->preferences
        ]);
    }
}
