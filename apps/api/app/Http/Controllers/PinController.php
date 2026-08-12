<?php

namespace App\Http\Controllers;

use App\Models\Pin;
use Illuminate\Http\Request;

class PinController extends Controller
{
    public function index(Request $request)
    {
        $pins = $request->user()->pins()->latest()->limit(100)->get();
        return response()->json($pins);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string',
            'target_id' => 'required|string',
            'label' => 'required|string',
            'href' => 'required|string',
            'icon' => 'nullable|string',
        ]);

        $pin = $request->user()->pins()->updateOrCreate(
            ['type' => $validated['type'], 'target_id' => $validated['target_id']],
            $validated
        );

        $user = $request->user();
        $activeRole = str_replace('role:', '', $user->currentAccessToken()->abilities[0] ?? 'employee');
        $today = \Carbon\Carbon::now()->toDateString();
        \Illuminate\Support\Facades\Cache::forget("dashboard_init_{$user->id}_{$activeRole}_{$today}");
        \Illuminate\Support\Facades\Cache::forget("user_pins_{$user->id}");

        return response()->json($pin, 201);
    }

    public function destroy(Request $request, string $id)
    {
        $pin = $request->user()->pins()->findOrFail($id);
        $pin->delete();

        $user = $request->user();
        $activeRole = str_replace('role:', '', $user->currentAccessToken()->abilities[0] ?? 'employee');
        $today = \Carbon\Carbon::now()->toDateString();
        \Illuminate\Support\Facades\Cache::forget("dashboard_init_{$user->id}_{$activeRole}_{$today}");
        \Illuminate\Support\Facades\Cache::forget("user_pins_{$user->id}");

        return response()->json(null, 204);
    }
}
