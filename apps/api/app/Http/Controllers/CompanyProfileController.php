<?php

namespace App\Http\Controllers;

use App\Models\CompanyProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CompanyProfileController extends Controller
{
    public function show()
    {
        $profile = CompanyProfile::first();
        if (!$profile) {
            $profile = CompanyProfile::create([
                'name' => 'My Company',
                'timezone' => 'UTC',
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
            'logo_url' => 'nullable|string',
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

            $logoUrl = Storage::disk($disk)->url($path);

            $profile = CompanyProfile::first();
            if (!$profile) {
                $profile = new CompanyProfile();
            }
            $profile->logo_url = $logoUrl;
            $profile->updated_by = $request->user()->id;
            $profile->save();

            return response()->json(['logo_url' => $logoUrl]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Company logo upload failed: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to upload logo. Please check server storage permissions.'], 500);
        }
    }
}
