<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WorkScheduleController extends Controller
{
    public function index()
    {
        $schedules = DB::table('work_schedules')->get();
        return response()->json($schedules);
    }

    public function update(Request $request, int $id)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'start_time' => 'required|string',
            'end_time' => 'required|string',
            'break_minutes' => 'required|integer',
            'standard_seconds' => 'required|integer',
            'grace_minutes' => 'required|integer|min:0|max:120',
            'working_days' => 'required|array',
        ]);

        $validated['working_days'] = json_encode($validated['working_days']);

        DB::table('work_schedules')
            ->where('id', $id)
            ->update(array_merge($validated, ['updated_at' => now()]));

        \Illuminate\Support\Facades\Cache::forget('default_work_schedule');
        \Illuminate\Support\Facades\Cache::forget("work_schedule_{$id}");

        return response()->json(['message' => 'Work schedule updated successfully']);
    }
}
