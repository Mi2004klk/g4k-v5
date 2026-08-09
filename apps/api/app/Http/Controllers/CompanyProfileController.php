<?php

namespace App\Http\Controllers;

use App\Models\CompanyProfile;
use Illuminate\Http\Request;

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
}
