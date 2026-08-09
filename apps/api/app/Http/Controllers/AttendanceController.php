<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use Carbon\Carbon;
use App\Services\AttendanceService;
use App\Services\AuditLogger;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttendanceController extends Controller
{
    public function __construct()
    {
        $this->middleware('capability:employee.clock-self')->only(['clockIn', 'startBreak', 'endBreak', 'clockOut', 'meToday', 'meHistory', 'meDay']);
        $this->middleware('capability:admin.view-all-attendance|hr.view-team-attendance')->only(['overview', 'hrToday', 'hrGraph', 'export']);
        $this->middleware('capability:admin.correct-attendance|attendance.correct-team')->only(['correct']);
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

        $events = DB::table('attendance_events')
            ->where('user_id', $user->id)
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

        $day = DB::table('attendance_days')
            ->where('user_id', $user->id)
            ->where('date', $date)
            ->first();

        $events = DB::table('attendance_events')
            ->where('user_id', $user->id)
            ->whereDate('timestamp', $date)
            ->orderBy('timestamp', 'asc')
            ->get();

        return response()->json([
            'day' => $day,
            'events' => $events,
        ]);
    }

    public function meHistory(Request $request)
    {
        $user = $request->user();
        $days = DB::table('attendance_days')
            ->where('user_id', $user->id)
            ->orderBy('date', 'desc')
            ->cursorPaginate(30);

        return response()->json($days);
    }

    public function meDay(Request $request, string $date)
    {
        $user = $request->user();
        $day = DB::table('attendance_days')
            ->where('user_id', $user->id)
            ->where('date', $date)
            ->first();

        $events = DB::table('attendance_events')
            ->where('user_id', $user->id)
            ->whereDate('timestamp', $date)
            ->orderBy('timestamp', 'asc')
            ->get();

        return response()->json([
            'day' => $day,
            'events' => $events,
        ]);
    }

    public function overview(Request $request)
    {
        $query = DB::table('attendance_days')
            ->join('users', 'users.id', '=', 'attendance_days.user_id')
            ->select('attendance_days.*', 'users.name as user_name', 'users.email as user_email', 'users.department_id')
            ->orderBy('date', 'desc');

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

        $query = DB::table('attendance_days');

        if ($mode === 'weekly') {
            $start = $carbonDate->copy()->startOfWeek();
            $end = $carbonDate->copy()->endOfWeek();
            $query->whereBetween('date', [$start->toDateString(), $end->toDateString()]);
        } else {
            $start = $carbonDate->copy()->startOfMonth();
            $end = $carbonDate->copy()->endOfMonth();
            $query->whereBetween('date', [$start->toDateString(), $end->toDateString()]);
        }

        $stats = $query->select('date', DB::raw('count(*) as total'), DB::raw('sum(case when status="present" then 1 else 0 end) as present'), DB::raw('sum(case when status="late" then 1 else 0 end) as late'), DB::raw('sum(case when status="absent" then 1 else 0 end) as absent'))
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

        $day = DB::table('attendance_days')->where('id', $validated['attendance_day_id'])->first();
        $actor = $request->user();

        // HR-CORRECT: HR may only correct attendance within their own team/department.
        $isAdmin = DB::table('role_assignments')->where('user_id', $actor->id)->whereIn('role', ['super_admin', 'admin'])->exists();
        if (!$isAdmin) {
            $targetUser = DB::table('users')->where('id', $day->user_id)->first();
            if ($targetUser->department_id !== $actor->department_id) {
                return response()->json(['message' => 'Forbidden. HR users can only correct attendance within their assigned department/team.'], 403);
            }
        }

        $before = (array) $day;

        $field = $validated['field'];
        $oldValue = $day->$field ?? null;

        // Apply correction
        DB::table('attendance_days')
            ->where('id', $day->id)
            ->update([
                $field => $validated['new_value'],
                'corrected_by' => $request->user()->id,
                'source' => 'manual',
                'version' => DB::raw('version + 1'),
                'updated_at' => now(),
            ]);

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

        $updatedDay = DB::table('attendance_days')->where('id', $day->id)->first();
        AuditLogger::log($request, 'correct', 'attendance_day', $day->id, $before, (array) $updatedDay);

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

        $callback = function () use ($date) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Date', 'Employee Name', 'Email', 'Status', 'Total Worked (hh:mm)', 'Overtime (hh:mm)', 'Late (mins)']);

            $records = DB::table('attendance_days')
                ->join('users', 'users.id', '=', 'attendance_days.user_id')
                ->select('attendance_days.*', 'users.name as user_name', 'users.email as user_email')
                ->where('date', $date)
                ->get();

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
