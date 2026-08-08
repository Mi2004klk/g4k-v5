<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class AttendanceController extends Controller
{
    public function today(Request $request)
    {
        $userId = $request->user()->id;
        $today = now()->toDateString();
        
        $logs = DB::table('attendance_logs')
            ->where('user_id', $userId)
            ->whereDate('timestamp', $today)
            ->orderBy('timestamp', 'asc')
            ->get();
            
        // Calculate state: not_started, active, on_break, completed
        $state = 'not_started';
        $lastPunch = null;
        $totalWorkedSeconds = 0;
        
        $inTime = null;
        $breakStart = null;
        
        foreach ($logs as $log) {
            $ts = \Carbon\Carbon::parse($log->timestamp);
            if ($log->type === 'CLOCK_IN') {
                $state = 'active';
                $inTime = $ts;
                $lastPunch = $ts;
            } elseif ($log->type === 'BREAK_START') {
                $state = 'on_break';
                if ($inTime) {
                    $totalWorkedSeconds += $ts->diffInSeconds($lastPunch);
                }
                $breakStart = $ts;
                $lastPunch = $ts;
            } elseif ($log->type === 'BREAK_END') {
                $state = 'active';
                $lastPunch = $ts;
            } elseif ($log->type === 'CLOCK_OUT') {
                $state = 'completed';
                if ($inTime && $state !== 'on_break') {
                    $totalWorkedSeconds += $ts->diffInSeconds($lastPunch);
                }
                $lastPunch = $ts;
            }
        }
        
        if ($state === 'active' && $lastPunch) {
            $totalWorkedSeconds += now()->diffInSeconds($lastPunch);
        }

        return response()->json([
            'state' => $state,
            'logs' => $logs,
            'total_worked_seconds' => $totalWorkedSeconds,
            'server_time' => now()->toIso8601String()
        ]);
    }

    public function clock(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:CLOCK_IN,BREAK_START,BREAK_END,CLOCK_OUT',
        ]);
        
        $userId = $request->user()->id;
        $now = now();
        $date = $now->toDateString();
        
        // Prevent multiple sequential same-type punches (omitted complex validation for brevity)
        DB::table('attendance_logs')->insert([
            'user_id' => $userId,
            'type' => $validated['type'],
            'timestamp' => $now,
            'ip_address' => $request->ip(),
            'created_at' => $now,
            'updated_at' => $now
        ]);
        
        // Upsert record
        DB::table('attendance_records')->updateOrInsert(
            ['user_id' => $userId, 'date' => $date],
            ['status' => 'present', 'updated_at' => $now]
        );

        return $this->today($request);
    }
    
    public function history(Request $request)
    {
        // Simple heatmap data return
        $records = DB::table('attendance_records')
            ->where('user_id', $request->user()->id)
            ->whereDate('date', '>=', now()->subMonths(3))
            ->get();
            
        return response()->json(['records' => $records]);
    }

    public function company(Request $request)
    {
        // Require HR or Admin
        $today = now()->toDateString();
        
        $records = DB::table('attendance_records')
            ->join('users', 'users.id', '=', 'attendance_records.user_id')
            ->where('date', $today)
            ->select('users.name', 'users.email', 'attendance_records.*')
            ->get();
            
        return response()->json(['records' => $records]);
    }
}
