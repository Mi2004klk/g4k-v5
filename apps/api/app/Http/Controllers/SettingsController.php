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
        $updatedCategories = [];

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
            $updatedCategories[] = $settingData['category'];
        }

        if ($bustSmtp) {
            \App\Support\SmtpSettings::bust();
        }

        \App\Services\CapabilityMatrix::clearCache();

        $updatedCategories = array_unique($updatedCategories);
        foreach ($updatedCategories as $category) {
            \Illuminate\Support\Facades\Cache::forget("settings_{$category}");
            \Illuminate\Support\Facades\Cache::forget("settings:{$category}");
        }
        
        // Bust specific notification channels if notifications were updated
        if (in_array('notifications', $updatedCategories)) {
            // Since we can't easily wildcard forget in some cache drivers,
            // we'll bust the known types.
            $types = ['leave_request', 'attendance_reminder', 'weekly_summary', 'task_assigned', 'chat', 'security', 'warning', 'system'];
            foreach ($types as $type) {
                \Illuminate\Support\Facades\Cache::forget("settings:notifications:{$type}.channels");
            }
        }

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

    public function jobs()
    {
        try {
            $pendingCount = \Illuminate\Support\Facades\Schema::hasTable('jobs') 
                ? \Illuminate\Support\Facades\DB::table('jobs')->count() 
                : 0;
            
            $failedJobs = \Illuminate\Support\Facades\Schema::hasTable('failed_jobs') 
                ? \Illuminate\Support\Facades\DB::table('failed_jobs')->orderBy('failed_at', 'desc')->take(20)->get() 
                : collect([]);

            return response()->json([
                'pending_count' => $pendingCount,
                'failed_count' => count($failedJobs),
                'failed_jobs' => $failedJobs,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'pending_count' => 0,
                'failed_count' => 0,
                'failed_jobs' => [],
                'error' => 'Queue tables unavailable',
            ]);
        }
    }

    public function retryJobs()
    {
        \Illuminate\Support\Facades\Artisan::call('queue:retry', ['id' => 'all']);
        return response()->json(['message' => 'Failed jobs queued for retry.']);
    }
}
