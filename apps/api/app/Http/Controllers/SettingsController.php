<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SettingsController extends Controller
{
    public function index()
    {
        $settings = DB::table('settings')->get()->keyBy('key')->map(function ($item) {
            if ($item->type === 'json') {
                return json_decode($item->value, true);
            }
            if ($item->type === 'boolean') {
                return filter_var($item->value, FILTER_VALIDATE_BOOLEAN);
            }
            return $item->value;
        });
        
        return response()->json(['data' => $settings]);
    }

    public function update(Request $request)
    {
        $payload = $request->all();
        
        DB::transaction(function () use ($payload, $request) {
            foreach ($payload as $key => $value) {
                $type = 'string';
                $dbValue = $value;
                
                if (is_array($value)) {
                    $type = 'json';
                    $dbValue = json_encode($value);
                } elseif (is_bool($value)) {
                    $type = 'boolean';
                    $dbValue = $value ? '1' : '0';
                }

                DB::table('settings')->updateOrInsert(
                    ['key' => $key],
                    ['value' => $dbValue, 'type' => $type, 'updated_at' => now()]
                );
            }

            // Log this to audit
            DB::table('audit_logs')->insert([
                'user_id' => $request->user()->id,
                'action_type' => 'settings_updated',
                'resource_name' => 'system_settings',
                'metadata' => json_encode(['keys' => array_keys($payload)]),
                'ip_address' => $request->ip(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        return response()->json(['message' => 'Settings updated successfully']);
    }
}
