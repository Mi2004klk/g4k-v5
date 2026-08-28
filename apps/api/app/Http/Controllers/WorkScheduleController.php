<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WorkScheduleController extends Controller
{
    public function index()
    {
        $schedules = DB::table('work_schedules')
            ->select('work_schedules.*', DB::raw('(SELECT COUNT(*) FROM users WHERE users.work_schedule_id = work_schedules.id) as users_count'))
            ->get();
        return response()->json(['data' => $schedules]);
    }

    public function update(Request $request, int $id)
    {
        $schedule = DB::table('work_schedules')->where('id', $id)->first();
        if (!$schedule) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'break_minutes' => 'required|integer|min:0',
            'standard_seconds' => 'required|integer|min:0',
            'grace_minutes' => 'required|integer|min:0|max:120',
            'working_days' => 'required|array',
            'working_days.*' => 'integer|in:0,1,2,3,4,5,6',
            'is_default' => 'nullable|boolean',
        ]);

        $validated['working_days'] = json_encode($validated['working_days']);
        $updateData = array_merge($validated, ['updated_at' => now()]);
        
        DB::beginTransaction();
        try {
            if ($request->has('is_default')) {
                $isDefault = $validated['is_default'] ?? false;
                if ($isDefault) {
                    DB::table('work_schedules')->update(['is_default' => false]);
                }
                $updateData['is_default'] = $isDefault;
            }
            
            DB::table('work_schedules')
                ->where('id', $id)
                ->update($updateData);
                
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        \Illuminate\Support\Facades\Cache::forget('default_work_schedule');
        \Illuminate\Support\Facades\Cache::forget("work_schedule_{$id}");

        \App\Services\AuditLogger::log($request, 'update', 'work_schedule', $id, (array)$schedule, $updateData);

        return response()->json(['message' => 'Work schedule updated successfully']);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'break_minutes' => 'required|integer|min:0',
            'standard_seconds' => 'required|integer|min:0',
            'grace_minutes' => 'required|integer|min:0|max:120',
            'working_days' => 'required|array',
            'working_days.*' => 'integer|in:0,1,2,3,4,5,6',
            'is_default' => 'nullable|boolean',
        ]);

        $validated['working_days'] = json_encode($validated['working_days']);
        $isDefault = $validated['is_default'] ?? false;

        DB::beginTransaction();
        try {
            if ($isDefault) {
                DB::table('work_schedules')->update(['is_default' => false]);
            }
            
            $id = DB::table('work_schedules')->insertGetId(array_merge($validated, [
                'is_default' => $isDefault,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
            
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        if ($isDefault) {
            \Illuminate\Support\Facades\Cache::forget('default_work_schedule');
        }

        \App\Services\AuditLogger::log($request, 'create', 'work_schedule', $id, null, $validated);

        return response()->json(['message' => 'Work schedule created successfully', 'id' => $id], 201);
    }

    public function setDefault(int $id)
    {
        $schedule = DB::table('work_schedules')->where('id', $id)->first();
        if (!$schedule) {
            return response()->json(['message' => 'Not found'], 404);
        }

        DB::beginTransaction();
        try {
            DB::table('work_schedules')->update(['is_default' => false]);
            DB::table('work_schedules')->where('id', $id)->update(['is_default' => true, 'updated_at' => now()]);
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        \Illuminate\Support\Facades\Cache::forget('default_work_schedule');
        \Illuminate\Support\Facades\Cache::forget("work_schedule_{$id}");

        \App\Services\AuditLogger::log($request, 'set_default', 'work_schedule', $id, null, null);

        return response()->json(['message' => 'Default work schedule updated']);
    }

    public function destroy(int $id)
    {
        $schedule = DB::table('work_schedules')->where('id', $id)->first();
        if (!$schedule) {
            return response()->json(['message' => 'Not found'], 404);
        }
        if ($schedule->is_default) {
            return response()->json(['message' => 'Cannot delete default schedule'], 400);
        }

        $usersCount = DB::table('users')->where('work_schedule_id', $id)->count();
        if ($usersCount > 0) {
            return response()->json(['message' => "Cannot delete schedule used by {$usersCount} users"], 400);
        }

        DB::table('work_schedules')->where('id', $id)->delete();
        \Illuminate\Support\Facades\Cache::forget("work_schedule_{$id}");

        \App\Services\AuditLogger::log($request, 'delete', 'work_schedule', $id, (array)$schedule, null);

        return response()->json(['message' => 'Work schedule deleted']);
    }
}
