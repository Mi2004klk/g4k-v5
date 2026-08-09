<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index()
    {
        $settings = Setting::all()->groupBy('category');
        return response()->json($settings);
    }

    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.category' => 'required|string',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'required', // Can be array, string, boolean
        ]);

        foreach ($validated['settings'] as $settingData) {
            Setting::updateOrCreate(
                [
                    'category' => $settingData['category'],
                    'key' => $settingData['key'],
                ],
                [
                    'value' => $settingData['value'],
                    'updated_by' => $request->user()->id,
                ]
            );
        }

        return response()->json(['message' => 'Settings updated successfully']);
    }
}
