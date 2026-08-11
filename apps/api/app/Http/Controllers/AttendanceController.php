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
use App\Http\Requests\CorrectAttendanceRequest;

class AttendanceController extends Controller
{

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
        
        if (!empty($validated['timestamp'])) {
            $parsedTs = Carbon::parse($validated['timestamp']);
            if ($parsedTs->gt(now()->addMinutes(5))) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'timestamp' => ['Timestamp cannot be more than 5 minutes in the future.']
                ]);
            }
            if ($parsedTs->lt(now()->subHours(48))) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'timestamp' => ['Timestamp cannot be more than 48 hours in the past.']
                ]);
            }
        }

        $timestamp = $validated['timestamp'] ?? now()->toIso8601String();

        $dayRecord = AttendanceService::recordEvent(
            $user->id,
            $type,
            $timestamp,
            $validated['client_id'],
            $validated['meta'] ?? null
        );

        AuditLogger::log($request, "attendance.{$type}", 'AttendanceDay', $dayRecord['id'] ?? 0, null, [
            'client_id' => $validated['client_id'],
            'device_meta' => $validated['meta'] ?? null
        ]);

        $events = AttendanceEvent::where('user_id', $user->id)
            ->whereDate('timestamp', Carbon::parse($timestamp)->toDateString())
            ->orderBy('timestamp', 'asc')
            ->get();

        return response()->json([
            'day' => $dayRecord,
            'events' => $events,
        ]);
    }

    public function sync(Request $request)
    {
        $validated = $request->validate([
            'events' => 'required|array',
            'events.*.client_id' => 'required|string',
            'events.*.type' => 'required|in:clock_in,clock_out,break_start,break_end',
            'events.*.timestamp' => 'required|date',
            'events.*.meta' => 'nullable|array',
        ]);

        $user = $request->user();
        $syncedDates = [];
        $now = now();

        // Sort events chronologically to process them in order
        $events = collect($validated['events'])->sortBy('timestamp')->values();

        foreach ($events as $ev) {
            $ts = Carbon::parse($ev['timestamp']);
            
            // Reject future timestamps (allow 5 min drift max)
            if ($ts->gt($now->copy()->addMinutes(5))) {
                continue;
            }

            try {
                AttendanceService::recordEvent(
                    $user->id,
                    $ev['type'],
                    $ev['timestamp'],
                    $ev['client_id'],
                    $ev['meta'] ?? null
                );
                $syncedDates[] = $ts->toDateString();
            } catch (\Illuminate\Validation\ValidationException $e) {
                // If sequence is invalid during sync, we skip that event
                // Usually client-side state machine prevents this, but server is authority
                continue;
            }
        }

        $syncedDates = array_unique($syncedDates);
        $reconciledDays = [];
        
        $schedule = null;
        if ($user->work_schedule_id) {
            $schedule = \Illuminate\Support\Facades\Cache::remember("work_schedule_{$user->work_schedule_id}", 300, function() use ($user) {
                return \Illuminate\Support\Facades\DB::table('work_schedules')->where('id', $user->work_schedule_id)->first();
            });
        }
        if (!$schedule) {
            $schedule = \Illuminate\Support\Facades\Cache::remember('default_work_schedule', 3600, function() {
                return \Illuminate\Support\Facades\DB::table('work_schedules')->where('is_default', true)->first();
            });
        }

        foreach ($syncedDates as $date) {
            $reconciledDays[] = AttendanceService::reconcileDay($user->id, $date, false, $user, $schedule);
        }

        return response()->json([
            'message' => 'Sync successful',
            'reconciled_days' => $reconciledDays,
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
        $schedule = \Illuminate\Support\Facades\Cache::remember('default_work_schedule', 3600, function() {
            return DB::table('work_schedules')->where('is_default', true)->first();
        });
        $standardSeconds = $schedule ? $schedule->standard_seconds : 31500;

        $lastMod = max(($day?->updated_at) ?? '', ($events->max('updated_at')) ?? '');
        $response = response()->json([
            'day' => $day,
            'events' => $events,
            'standard_seconds' => $standardSeconds,
        ]);
        $response->setEtag(md5($user->id . '_' . $date . '_' . $lastMod));
        $response->header('Cache-Control', 'private, max-age=30');
        $response->isNotModified($request);

        return $response;
    }

    public function meHistory(Request $request)
    {
        $user = $request->user();
        $days = AttendanceDay::where('user_id', $user->id)
            ->orderBy('date', 'desc')
            ->cursorPaginate(30);

        // Fetch task_time_logs for the paginated dates
        $dates = collect($days->items())->pluck('date')->toArray();
        $logs = \App\Models\TaskTimeLog::with(['project', 'task'])
            ->where('user_id', $user->id)
            ->whereIn('log_date', $dates)
            ->get();

        $logsByDate = $logs->groupBy('log_date');

        foreach ($days->items() as $day) {
            $dayLogs = $logsByDate->get($day->date, collect());
            $projects = $dayLogs->map(fn($l) => $l->project->name ?? 'Unknown')->unique()->values();
            $tasks = $dayLogs->map(fn($l) => $l->task->title ?? $l->description)->unique()->values();
            
            $day->projects = $projects;
            $day->tasks = $tasks;
        }

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
        $activeRole = str_replace('role:', '', $user->currentAccessToken()->abilities[0] ?? 'employee');
        $isAdmin = $activeRole === 'super_admin';
        
        if (!$isAdmin) {
            $query->where('users.department_id', $user->department_id);
        }
        return $query;
    }

    public function overview(Request $request)
    {
        $query = DB::table('attendance_days')
            ->join('users', 'users.id', '=', 'attendance_days.user_id')
            ->leftJoin('departments', 'users.department_id', '=', 'departments.id')
            ->select('attendance_days.*', 'users.name as user_name', 'users.email as user_email', 'users.department_id', 'departments.name as department_name')
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
        if ($request->filled('search')) {
            $searchTerm = '%' . $request->query('search') . '%';
            $query->where(function($q) use ($searchTerm) {
                $q->where('users.name', 'like', $searchTerm)
                  ->orWhere('users.email', 'like', $searchTerm);
            });
        }

        $results = $query->cursorPaginate(20);
        $response = response()->json($results);
        $lastModified = collect($results->items())->max('updated_at') ?? '';
        $response->setEtag(md5($results->count() . $lastModified . $request->fullUrl()));
        $response->header('Cache-Control', 'private, max-age=30');
        $response->isNotModified($request);

        return $response;
    }

    public function hrDay(Request $request, string $date, int $userId)
    {
        // First verify they have access to this user (same department or admin)
        $targetUser = \App\Models\User::findOrFail($userId);
        $activeRole = str_replace('role:', '', $request->user()->currentAccessToken()->abilities[0] ?? 'employee');
        $isAdmin = $activeRole === 'super_admin';
            
        if (!$isAdmin && $request->user()->department_id !== $targetUser->department_id) {
            return response()->json(['message' => 'Unauthorized access to this user\'s attendance.'], 403);
        }

        $day = AttendanceDay::where('user_id', $userId)
            ->where('date', $date)
            ->first();

        $events = AttendanceEvent::where('user_id', $userId)
            ->whereDate('timestamp', $date)
            ->orderBy('timestamp', 'asc')
            ->get();

        return response()->json([
            'day' => $day,
            'events' => $events,
            'user' => [
                'id' => $targetUser->id,
                'name' => $targetUser->name,
                'email' => $targetUser->email,
            ]
        ]);
    }

    public function hrHistory(Request $request, int $userId)
    {
        // First verify they have access to this user
        $targetUser = \App\Models\User::findOrFail($userId);
        $activeRole = str_replace('role:', '', $request->user()->currentAccessToken()->abilities[0] ?? 'employee');
        $isAdmin = $activeRole === 'super_admin';
            
        if (!$isAdmin && $request->user()->department_id !== $targetUser->department_id) {
            return response()->json(['message' => 'Unauthorized access to this user\'s history.'], 403);
        }

        $days = AttendanceDay::where('user_id', $userId)
            ->orderBy('date', 'desc')
            ->cursorPaginate(30);

        // Fetch task_time_logs for the paginated dates
        $dates = collect($days->items())->pluck('date')->toArray();
        $logs = \App\Models\TaskTimeLog::with(['project', 'task'])
            ->where('user_id', $userId)
            ->whereIn('log_date', $dates)
            ->get();

        $logsByDate = $logs->groupBy('log_date');

        foreach ($days->items() as $day) {
            $dayLogs = $logsByDate->get($day->date, collect());
            $projects = $dayLogs->map(fn($l) => $l->project->name ?? 'Unknown')->unique()->values();
            $tasks = $dayLogs->map(fn($l) => $l->task->title ?? $l->description)->unique()->values();
            
            $day->projects = $projects;
            $day->tasks = $tasks;
        }

        return response()->json([
            'data' => collect($days->items())->map(function($day) {
                return $day;
            }),
            'next_cursor' => $days->nextCursor()?->encode(),
            'user' => [
                'id' => $targetUser->id,
                'name' => $targetUser->name,
                'email' => $targetUser->email,
            ]
        ]);
    }

    public function hrToday(Request $request)
    {
        $query = DB::table('attendance_days')
            ->join('users', 'users.id', '=', 'attendance_days.user_id')
            ->leftJoin('departments', 'users.department_id', '=', 'departments.id')
            ->select('attendance_days.*', 'users.name as user_name', 'users.email as user_email', 'users.department_id', 'departments.name as department_name')
            ->where('date', now()->toDateString())
            ->orderBy('date', 'desc');

        $this->applyHrScoping($query, $request->user());

        if ($request->filled('department_id')) {
            $query->where('users.department_id', $request->query('department_id'));
        }
        if ($request->filled('status')) {
            $query->where('attendance_days.status', $request->query('status'));
        }
        if ($request->filled('search')) {
            $searchTerm = '%' . $request->query('search') . '%';
            $query->where(function($q) use ($searchTerm) {
                $q->where('users.name', 'like', $searchTerm)
                  ->orWhere('users.email', 'like', $searchTerm);
            });
        }

        $results = $query->cursorPaginate(20);
        $response = response()->json($results);
        $lastModified = collect($results->items())->max('updated_at') ?? '';
        $response->setEtag(md5($results->count() . $lastModified . $request->fullUrl()));
        $response->header('Cache-Control', 'private, max-age=30');
        $response->isNotModified($request);

        return $response;
    }

    public function hrGraph(Request $request)
    {
        $validated = $request->validate([
            'mode' => 'nullable|in:weekly,monthly',
            'groupBy' => 'nullable|in:date,employee',
            'date' => 'nullable|date',
        ]);

        $mode = $validated['mode'] ?? 'weekly';
        $date = $validated['date'] ?? now()->toDateString();
        $groupBy = $validated['groupBy'] ?? 'date';
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

        if ($groupBy === 'employee') {
            $stats = $query->select('users.id', 'users.name', DB::raw('count(*) as total'), DB::raw('sum(case when attendance_days.status=\'present\' then 1 else 0 end) as present'), DB::raw('sum(case when attendance_days.status=\'late\' then 1 else 0 end) as late'), DB::raw('sum(case when attendance_days.status=\'absent\' then 1 else 0 end) as absent'))
                ->groupBy('users.id', 'users.name')
                ->orderBy('users.name', 'asc')
                ->get();
        } else {
            $stats = $query->select('date', DB::raw('count(*) as total'), DB::raw('sum(case when attendance_days.status=\'present\' then 1 else 0 end) as present'), DB::raw('sum(case when attendance_days.status=\'late\' then 1 else 0 end) as late'), DB::raw('sum(case when attendance_days.status=\'absent\' then 1 else 0 end) as absent'))
                ->groupBy('date')
                ->orderBy('date', 'asc')
                ->get();
        }

        return response()->json(['stats' => $stats, 'mode' => $mode]);
    }

    public function adminGraph(Request $request)
    {
        $validated = $request->validate([
            'mode' => 'nullable|in:weekly,monthly',
            'groupBy' => 'nullable|in:date,employee',
            'date' => 'nullable|date',
        ]);

        $mode = $validated['mode'] ?? 'weekly';
        $date = $validated['date'] ?? now()->toDateString();
        $groupBy = $validated['groupBy'] ?? 'date';
        $carbonDate = Carbon::parse($date);

        $query = DB::table('attendance_days')
            ->join('users', 'users.id', '=', 'attendance_days.user_id');
            
        if ($mode === 'weekly') {
            $start = $carbonDate->copy()->startOfWeek();
            $end = $carbonDate->copy()->endOfWeek();
            $query->whereBetween('date', [$start->toDateString(), $end->toDateString()]);
        } else {
            $start = $carbonDate->copy()->startOfMonth();
            $end = $carbonDate->copy()->endOfMonth();
            $query->whereBetween('date', [$start->toDateString(), $end->toDateString()]);
        }

        if ($groupBy === 'employee') {
            $stats = $query->select('users.id', 'users.name', DB::raw('count(*) as total'), DB::raw('sum(case when attendance_days.status=\'present\' then 1 else 0 end) as present'), DB::raw('sum(case when attendance_days.status=\'late\' then 1 else 0 end) as late'), DB::raw('sum(case when attendance_days.status=\'absent\' then 1 else 0 end) as absent'))
                ->groupBy('users.id', 'users.name')
                ->orderBy('users.name', 'asc')
                ->get();
        } else {
            $stats = $query->select('date', DB::raw('count(*) as total'), DB::raw('sum(case when attendance_days.status=\'present\' then 1 else 0 end) as present'), DB::raw('sum(case when attendance_days.status=\'late\' then 1 else 0 end) as late'), DB::raw('sum(case when attendance_days.status=\'absent\' then 1 else 0 end) as absent'))
                ->groupBy('date')
                ->orderBy('date', 'asc')
                ->get();
        }

        return response()->json(['stats' => $stats, 'mode' => $mode]);
    }

    public function correct(CorrectAttendanceRequest $request)
    {
        $validated = $request->validated();

        $day = AttendanceDay::where('id', $validated['attendance_day_id'])->first();
        $actor = $request->user();

        // HR-CORRECT: HR may only correct attendance within their own team/department.
        $activeRole = str_replace('role:', '', $actor->currentAccessToken()->abilities[0] ?? 'employee');
        $isAdmin = $activeRole === 'super_admin';
            
        if (!$isAdmin) {
            $targetUser = User::where('id', $day->user_id)->first();
            if ($targetUser->department_id !== $actor->department_id) {
                return response()->json(['message' => 'Forbidden. HR users can only correct attendance within their assigned department/team.'], 403);
            }
        }

        $action = $validated['action'];
        $oldValue = null;
        $newValue = null;
        $field = $action;

        DB::beginTransaction();

        try {
            if ($action === 'add_event') {
                $ev = AttendanceEvent::create([
                    'client_id' => \Illuminate\Support\Str::uuid()->toString(),
                    'user_id' => $day->user_id,
                    'type' => $validated['type'],
                    'timestamp' => Carbon::parse($validated['timestamp']),
                    'source' => 'server',
                ]);
                $newValue = $ev->toArray();
            } elseif ($action === 'edit_event') {
                $ev = AttendanceEvent::findOrFail($validated['event_id']);
                $oldValue = $ev->toArray();
                if ($request->filled('type')) $ev->type = $validated['type'];
                if ($request->filled('timestamp')) $ev->timestamp = Carbon::parse($validated['timestamp']);
                $ev->source = 'server';
                $ev->save();
                $newValue = $ev->toArray();
            } elseif ($action === 'remove_event') {
                $ev = AttendanceEvent::findOrFail($validated['event_id']);
                $oldValue = $ev->toArray();
                $ev->delete();
            }

            // Ensure the day is marked manual so we know it was tampered with
            $day->update(['source' => 'manual']);

            // Insert audit correction record
            DB::table('attendance_corrections')->insert([
                'attendance_day_id' => $day->id,
                'corrected_by' => $request->user()->id,
                'field' => $field,
                'old_value' => $oldValue ? json_encode($oldValue) : null,
                'new_value' => $newValue ? json_encode($newValue) : null,
                'reason' => $validated['reason'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to apply correction.', 'error' => $e->getMessage()], 500);
        }

        // Run reconciliation based on the new events
        $reconciledDayData = AttendanceService::reconcileDay($day->user_id, $day->date, true);
        
        $updatedDay = AttendanceDay::where('id', $day->id)->first();
        AuditLogger::log($request, 'correct_event', 'attendance_day', $day->id, ['action' => $action, 'old' => $oldValue], $updatedDay->toArray());

        // Notify affected employee
        if ($day->user_id !== $actor->id) {
            \App\Models\Notification::create([
                'user_id' => $day->user_id,
                'title' => 'Attendance Corrected',
                'body' => "Your attendance for {$day->date} was corrected by {$actor->name}.",
                'type' => 'info',
            ]);
        }

        return response()->json([
            'message' => 'Attendance event corrected successfully.',
            'day' => $updatedDay,
            'events' => AttendanceEvent::where('user_id', $day->user_id)->whereDate('timestamp', $day->date)->orderBy('timestamp')->get(),
        ]);
    }

    public function export(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'ids' => 'nullable|string',
        ]);

        $startDate = $validated['start_date'] ?? now()->toDateString();
        $endDate = $validated['end_date'] ?? $startDate;

        $query = DB::table('attendance_days')
            ->join('users', 'users.id', '=', 'attendance_days.user_id')
            ->select('attendance_days.*', 'users.name as user_name', 'users.email as user_email')
            ->whereBetween('date', [$startDate, $endDate])
            ->orderBy('date', 'asc');
            
        if ($request->filled('ids')) {
            $ids = explode(',', $request->query('ids'));
            $query->whereIn('attendance_days.id', $ids);
        }
            
        $this->applyHrScoping($query, $request->user());
        return response()->streamDownload(function () use ($query) {
            $writer = \Spatie\SimpleExcel\SimpleExcelWriter::streamDownload('attendance_export.xlsx');
            
            $query->chunk(500, function ($records) use ($writer) {
                foreach ($records as $row) {
                    $hours = floor($row->total_seconds / 3600);
                    $mins = floor(($row->total_seconds % 3600) / 60);
                    $otHours = floor($row->overtime_seconds / 3600);
                    $otMins = floor(($row->overtime_seconds % 3600) / 60);

                    $writer->addRow([
                        'Date' => $row->date,
                        'Employee Name' => $row->user_name,
                        'Email' => $row->user_email,
                        'Status' => strtoupper($row->status),
                        'Total Worked (hh:mm)' => sprintf('%02dh %02dm', $hours, $mins),
                        'Overtime (hh:mm)' => sprintf('%02dh %02dm', $otHours, $otMins),
                        'Late (mins)' => $row->late_minutes,
                    ]);
                }
            });

            $writer->close();
        }, "attendance_export_{$startDate}_to_{$endDate}.xlsx");
    }

    public function notifyOpenShifts(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:attendance_days,id',
        ]);

        $days = AttendanceDay::whereIn('id', $validated['ids'])->with('user.department')->get();
        $hrUsers = User::with('roleAssignments')->whereHas('roleAssignments', function($q) {
            $q->whereIn('role', ['hr', 'super_admin']);
        })->get();

        $notifications = [];

        foreach ($days as $day) {
            foreach ($hrUsers as $hr) {
                // simple scoping: HR sees their own dept unless they are super admin
                $isSuper = $hr->roleAssignments->pluck('role')->contains('super_admin');
                if ($isSuper || $hr->department_id === $day->user->department_id) {
                    $notifications[] = [
                        'user_id' => $hr->id,
                        'title' => 'Open Shift Alert',
                        'body' => "Employee {$day->user->name} has an open shift for {$day->date}.",
                        'type' => 'warning',
                        'link' => "/dashboard/org/attendance?date={$day->date}",
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }
        }

        if (!empty($notifications)) {
            \App\Models\Notification::insert($notifications);
        }

        return response()->json(['message' => 'Notifications sent successfully.']);
    }
}

