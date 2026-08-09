<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\AttendanceDay;
use App\Models\AttendanceEvent;
use App\Models\RoleAssignment;
use Carbon\Carbon;
use App\Services\AttendanceService;
use App\Services\AuditLogger;
use Symfony\Component\HttpFoundation\StreamedResponse;

use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class AttendanceController extends Controller implements HasMiddleware
{
        public static function middleware(): array
    {
        return [
            new Middleware('capability:employee.clock-self', only: ['clockIn', 'startBreak', 'endBreak', 'clockOut', 'meToday', 'meHistory', 'meDay']),
            new Middleware('capability:admin.view-all-attendance|hr.view-team-attendance', only: ['overview', 'hrToday', 'hrGraph', 'export']),
            new Middleware('capability:admin.correct-attendance|attendance.correct-team', only: ['correct']),
        ];
    }

    public function clockIn(Request $request)
    {
        return $this->handlePunch($request, 'clock_in');
    }

    public function startBreak(Request $request)
    {
        return $this->handlePunch($request, 'break_start');
    }

    public function endBreak(Request $request)
    {
        return $this->handlePunch($request, 'break_end');
    }

    public function clockOut(Request $request)
    {
        return $this->handlePunch($request, 'clock_out');
    }

    private function handlePunch(Request $request, string $type)
    {
        $validated = $request->validate([
            'client_id' => 'required|string',
            'timestamp' => 'nullable|date',
            'meta' => 'nullable|array',
        ]);

        $user = $request->user();
        $timestamp = $validated['timestamp'] ?? now()->toIso8601String();

        $dayRecord = AttendanceService::recordEvent(
            $user->id,
            $type,
            $timestamp,
            $validated['client_id'],
            $validated['meta'] ?? null
        );

        $events = AttendanceEvent::where('user_id', $user->id)
            ->whereDate('timestamp', Carbon::parse($timestamp)->toDateString())
            ->orderBy('timestamp', 'asc')
            ->get();

        return response()->json([
            'day' => $dayRecord,
            'events' => $events,
        ]);
    }

    public function meToday(Request $request)
    {
        $user = $request->user();
        $date = now()->toDateString();

        $day = AttendanceDay::where('user_id', $user->id)
            ->where('date', $date)
            ->first();

        $events = AttendanceEvent::where('user_id', $user->id)
            ->whereDate('timestamp', $date)
            ->orderBy('timestamp', 'asc')
            ->get();

        // Pass work_schedules standard_seconds to frontend
        $schedule = DB::table('work_schedules')->where('is_default', true)->first();
        $standardSeconds = $schedule ? $schedule->standard_seconds : 31500;

        return response()->json([
            'day' => $day,
            'events' => $events,
            'standard_seconds' => $standardSeconds,
        ]);
    }

    public function meHistory(Request $request)
    {
        $user = $request->user();
        $days = AttendanceDay::where('user_id', $user->id)
            ->orderBy('date', 'desc')
            ->cursorPaginate(30);

        return response()->json($days);
    }

    public function meDay(Request $request, string $date)
    {
        $user = $request->user();
        $day = AttendanceDay::where('user_id', $user->id)
            ->where('date', $date)
            ->first();

        $events = AttendanceEvent::where('user_id', $user->id)
            ->whereDate('timestamp', $date)
            ->orderBy('timestamp', 'asc')
            ->get();

        return response()->json([
            'day' => $day,
            'events' => $events,
        ]);
    }

    private function applyHrScoping($query, $user)
    {
        $isAdmin = RoleAssignment::where('user_id', $user->id)
            ->whereIn('role', ['super_admin', 'admin'])
            ->exists();
        
        if (!$isAdmin) {
            $query->where('users.department_id', $user->department_id);
        }
        return $query;
    }

    public function overview(Request $request)
    {
        $query = DB::table('attendance_days')
            ->join('users', 'users.id', '=', 'attendance_days.user_id')
            ->select('attendance_days.*', 'users.name as user_name', 'users.email as user_email', 'users.department_id')
            ->orderBy('date', 'desc');

        $this->applyHrScoping($query, $request->user());

        if ($request->filled('date')) {
            $query->where('date', $request->query('date'));
        }
        if ($request->filled('department_id')) {
            $query->where('users.department_id', $request->query('department_id'));
        }
        if ($request->filled('status')) {
            $query->where('attendance_days.status', $request->query('status'));
        }

        return response()->json($query->cursorPaginate(20));
    }

    public function hrToday(Request $request)
    {
        $request->merge(['date' => now()->toDateString()]);
        return $this->overview($request);
    }

    public function hrGraph(Request $request)
    {
        $mode = $request->query('mode', 'weekly');
        $date = $request->query('date', now()->toDateString());
        $carbonDate = Carbon::parse($date);

        $query = DB::table('attendance_days')
            ->join('users', 'users.id', '=', 'attendance_days.user_id');
            
        $this->applyHrScoping($query, $request->user());

        if ($mode === 'weekly') {
            $start = $carbonDate->copy()->startOfWeek();
            $end = $carbonDate->copy()->endOfWeek();
            $query->whereBetween('date', [$start->toDateString(), $end->toDateString()]);
        } else {
            $start = $carbonDate->copy()->startOfMonth();
            $end = $carbonDate->copy()->endOfMonth();
            $query->whereBetween('date', [$start->toDateString(), $end->toDateString()]);
        }

        $stats = $query->select('date', DB::raw('count(*) as total'), DB::raw('sum(case when attendance_days.status="present" then 1 else 0 end) as present'), DB::raw('sum(case when attendance_days.status="late" then 1 else 0 end) as late'), DB::raw('sum(case when attendance_days.status="absent" then 1 else 0 end) as absent'))
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        return response()->json(['stats' => $stats, 'mode' => $mode]);
    }

    public function correct(Request $request)
    {
        $validated = $request->validate([
            'attendance_day_id' => 'required|exists:attendance_days,id',
            'field' => 'required|string',
            'new_value' => 'required',
            'reason' => 'required|string|max:500',
        ]);

        $day = AttendanceDay::where('id', $validated['attendance_day_id'])->first();
        $actor = $request->user();

        // HR-CORRECT: HR may only correct attendance within their own team/department.
        $isAdmin = RoleAssignment::where('user_id', $actor->id)
            ->whereIn('role', ['super_admin', 'admin'])
            ->exists();
            
        if (!$isAdmin) {
            $targetUser = User::where('id', $day->user_id)->first();
            if ($targetUser->department_id !== $actor->department_id) {
                return response()->json(['message' => 'Forbidden. HR users can only correct attendance within their assigned department/team.'], 403);
            }
        }

        $before = $day->toArray();

        $field = $validated['field'];
        $oldValue = $day->$field ?? null;

        // Apply correction
        $day->update([
            $field => $validated['new_value'],
            'corrected_by' => $request->user()->id,
            'source' => 'manual', // Triggers protection in reconcileDay
            'version' => DB::raw('version + 1'),
            'updated_at' => now(),
        ]);
        
        // Ensure reconcileDay is called if it was open shift fix or structural
        AttendanceService::reconcileDay($day->user_id, $day->date);

        // Insert audit correction record
        DB::table('attendance_corrections')->insert([
            'attendance_day_id' => $day->id,
            'corrected_by' => $request->user()->id,
            'field' => $field,
            'old_value' => json_encode($oldValue),
            'new_value' => json_encode($validated['new_value']),
            'reason' => $validated['reason'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $updatedDay = AttendanceDay::where('id', $day->id)->first();
        AuditLogger::log($request, 'correct', 'attendance_day', $day->id, $before, $updatedDay->toArray());

        return response()->json([
            'message' => 'Attendance record corrected successfully.',
            'day' => $updatedDay,
        ]);
    }

    public function export(Request $request)
    {
        $date = $request->query('date', now()->toDateString());

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"attendance_export_{$date}.csv\"",
        ];

        $callback = function () use ($date, $request) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Date', 'Employee Name', 'Email', 'Status', 'Total Worked (hh:mm)', 'Overtime (hh:mm)', 'Late (mins)']);

            $query = DB::table('attendance_days')
                ->join('users', 'users.id', '=', 'attendance_days.user_id')
                ->select('attendance_days.*', 'users.name as user_name', 'users.email as user_email')
                ->where('date', $date);
                
            $this->applyHrScoping($query, $request->user());
            
            $records = $query->get();

            foreach ($records as $row) {
                $hours = floor($row->total_seconds / 3600);
                $mins = floor(($row->total_seconds % 3600) / 60);
                $otHours = floor($row->overtime_seconds / 3600);
                $otMins = floor(($row->overtime_seconds % 3600) / 60);

                fputcsv($file, [
                    $row->date,
                    $row->user_name,
                    $row->user_email,
                    strtoupper($row->status),
                    sprintf('%02dh %02dm', $hours, $mins),
                    sprintf('%02dh %02dm', $otHours, $otMins),
                    $row->late_minutes,
                ]);
            }

            fclose($file);
        };

        return new StreamedResponse($callback, 200, $headers);
    }
}

