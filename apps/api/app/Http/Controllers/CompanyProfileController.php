<?php

namespace App\Http\Controllers;

use App\Models\CompanyProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CompanyProfileController extends Controller
{
    public function publicConfig()
    {
        $profile = CompanyProfile::first();
        return response()->json([
            'name' => $profile ? $profile->name : 'My Company',
            'logo_url' => $profile ? $profile->logo_url : null,
        ]);
    }

    public function show()
    {
        $profile = CompanyProfile::first();
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

        $profile = CompanyProfile::first();
        if (!$profile) {
            $profile = new CompanyProfile();
        }

        $profile->fill($validated);
        $profile->updated_by = $request->user()->id;
        $profile->save();

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

            $profile = CompanyProfile::first();
            $oldLogoUrl = $profile ? $profile->logo_url : null;

            $logoUrl = Storage::disk($disk)->url($path);

            if (!$profile) {
                $profile = new CompanyProfile();
                $profile->name = 'My Company';
                $profile->timezone = 'Asia/Kolkata';
            }
            $profile->logo_url = $logoUrl;
            $profile->updated_by = $request->user()->id;
            $profile->save();

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
