<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use App\Http\Requests\BulkUpdateSettingsRequest;

class SettingsController extends Controller
{
    public function index()
    {
        $settings = Setting::all()->groupBy('category');
        return response()->json($settings);
    }

    public function bulkUpdate(BulkUpdateSettingsRequest $request)
    {
        $validated = $request->validated();

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

        \App\Services\CapabilityMatrix::clearCache();

        return response()->json(['message' => 'Settings updated successfully']);
    }
}
