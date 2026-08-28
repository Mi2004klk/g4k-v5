<?php

namespace App\Http\Controllers;

use App\Models\CompanyProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Services\AuditLogger;

class CompanyProfileController extends Controller
{
    public function publicConfig(Request $request)
    {
        $profile = CompanyProfile::first();
        $isAuth = \Illuminate\Support\Facades\Auth::guard('sanctum')->check();
        
        $response = [
            'name' => $profile ? $profile->name : 'My Company',
            'logo_url' => $profile ? $profile->logo_url : null,
        ];
        
        if ($isAuth) {
            $settings = \Illuminate\Support\Facades\Cache::remember('settings:security', 60 * 60, function () {
                $rawSettings = \Illuminate\Support\Facades\DB::table('settings')
                    ->where('category', 'security')
                    ->pluck('value', 'key')
                    ->toArray();
                    
                $decoded = [];
                foreach ($rawSettings as $k => $v) {
                    $dec = json_decode($v, true);
                    $decoded[$k] = (json_last_error() === JSON_ERROR_NONE) ? $dec : $v;
                }
                return $decoded;
            });

            $response['force_password_change_compulsive'] = filter_var($settings['force_password_change'] ?? true, FILTER_VALIDATE_BOOLEAN);
            $response['password_policy'] = [
                'min_length' => (int)($settings['password.min_length'] ?? 8),
                'require_mixed' => filter_var($settings['password.require_mixed'] ?? 'true', FILTER_VALIDATE_BOOLEAN),
                'require_number' => filter_var($settings['password.require_number'] ?? 'true', FILTER_VALIDATE_BOOLEAN),
                'require_symbol' => filter_var($settings['password.require_symbol'] ?? 'true', FILTER_VALIDATE_BOOLEAN),
            ];
        }

        return response()->json($response);
    }

    public function show(Request $request)
    {
        $companyId = $request->user()?->company_id;
        $profile = $companyId ? CompanyProfile::find($companyId) : CompanyProfile::first();
        
        if (!$profile) {
            $profile = CompanyProfile::create([
                'name' => 'My Company',
                'timezone' => 'Asia/Kolkata',
            ]);
        }
        return response()->json($profile);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'short_name' => 'nullable|string|max:50',
            'timezone' => 'required|string',
            'branding' => 'nullable|array',
        ]);

        $companyId = $request->user()?->company_id;
        $profile = $companyId ? CompanyProfile::find($companyId) : CompanyProfile::first();
        if (!$profile) {
            $profile = new CompanyProfile();
        }

        $profile->fill($validated);
        $before = $profile->getOriginal();
        $profile->updated_by = $request->user()->id;
        $profile->save();

        AuditLogger::log($request, 'update', 'company_profile', $profile->id, $before, $profile->toArray());

        return response()->json($profile);
    }

    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|max:5120', // max 5MB
        ]);

        try {
            $disk = config('filesystems.default');
            $file = $request->file('logo');
            $path = $file->store('company-logos', $disk);

            if (!$path) {
                throw new \Exception('Failed to store file');
            }

            $companyId = $request->user()?->company_id;
            $profile = $companyId ? CompanyProfile::find($companyId) : CompanyProfile::first();
            $oldLogoUrl = $profile ? $profile->logo_url : null;

            $logoUrl = Storage::disk($disk)->url($path);

            if (!$profile) {
                $profile = new CompanyProfile();
                $profile->name = 'My Company';
                $profile->timezone = 'Asia/Kolkata';
            }
            $profile->logo_url = $logoUrl;
            $before = $profile->getOriginal();
            $profile->updated_by = $request->user()->id;
            $profile->save();
            
            AuditLogger::log($request, 'upload_logo', 'company_profile', $profile->id, $before, $profile->toArray());

            if ($oldLogoUrl) {
                try {
                    $oldBasename = basename(parse_url($oldLogoUrl, PHP_URL_PATH));
                    Storage::disk($disk)->delete('company-logos/' . $oldBasename);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning('Failed to delete old company logo: ' . $e->getMessage());
                }
            }

            return response()->json([
                'url' => $logoUrl,
                'path' => $path,
                'logo_url' => $logoUrl // keep for backward compatibility if any frontend code uses it
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Company logo upload failed: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to upload logo. Please check server storage permissions.'], 500);
        }
    }
}
