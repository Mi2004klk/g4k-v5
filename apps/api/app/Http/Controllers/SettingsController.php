<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use App\Http\Requests\BulkUpdateSettingsRequest;

class SettingsController extends Controller
{
    public function index()
    {
        $settings = Setting::all()->map(function($setting) {
            if ($setting->category === 'mail' && $setting->key === 'password') {
                $setting->value = '••••••';
            }
            return $setting;
        })->groupBy('category');
        return response()->json($settings);
    }

    public function bulkUpdate(BulkUpdateSettingsRequest $request)
    {
        $validated = $request->validated();
        $bustSmtp = false;

        foreach ($validated['settings'] as $settingData) {
            if ($settingData['category'] === 'mail' && $settingData['key'] === 'password') {
                if (empty($settingData['value']) || $settingData['value'] === '••••••') {
                    continue; // Skip updating password if empty or masked
                }
                $settingData['value'] = \Illuminate\Support\Facades\Crypt::encryptString($settingData['value']);
            }

            if ($settingData['category'] === 'mail') {
                $bustSmtp = true;
            }

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

        if ($bustSmtp) {
            \App\Support\SmtpSettings::bust();
        }

        \App\Services\CapabilityMatrix::clearCache();

        return response()->json(['message' => 'Settings updated successfully']);
    }

    public function testMail(Request $request)
    {
        $user = $request->user();
        if (!$user || empty($user->email)) {
            return response()->json(['message' => 'Your account does not have a valid email address.'], 400);
        }

        if (!\App\Support\SmtpSettings::isConfigured()) {
            return response()->json(['message' => 'SMTP is not configured.'], 400);
        }

        try {
            \App\Support\SmtpSettings::apply();
            
            \Illuminate\Support\Facades\Mail::raw('This is a test email from Games4king Workplace OS to verify SMTP settings.', function ($message) use ($user) {
                $message->to($user->email)->subject('SMTP Test - Games4king Workplace OS');
            });
            return response()->json(['message' => 'Test email sent successfully.']);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('SMTP Test Failed: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to send test email. Please check your settings.'], 500);
        }
    }
}
