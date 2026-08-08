<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class UserPreferenceController extends Controller
{
    public function show(Request $request)
    {
        return response()->json([
            'preferences' => $request->user()->preferences
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'preferences' => 'required|array'
        ]);

        $user = $request->user();
        
        // Merge with existing preferences
        $current = $user->preferences ?? [];
        $user->preferences = array_merge($current, $validated['preferences']);
        $user->save();

        return response()->json([
            'preferences' => $user->preferences
        ]);
    }
}
