<?php

namespace App\Jobs;

use App\Models\ExportJob;
use App\Models\User;
use App\Models\Task;
use App\Models\Project;
use App\Models\Department;
use App\Models\Designation;
use App\Events\ExportCompleted;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Spatie\SimpleExcel\SimpleExcelWriter;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;

class GenerateReportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $timeout = 120;
    
    public $exportJob;

    public function __construct(ExportJob $exportJob)
    {
        $this->exportJob = $exportJob;
    }

    public function handle(): void
    {
        try {
            $this->exportJob->update(['status' => 'processing']);

            $key = $this->exportJob->report_key;
            $format = $this->exportJob->format;
            $filename = "exports/report_{$key}_" . time() . ".{$format}";
            $disk = Storage::disk(config('filesystems.default'));

            if ($format === 'xlsx' || $format === 'csv') {
                $tempPath = sys_get_temp_dir() . '/' . uniqid('exp_') . ".{$format}";
                $writer = SimpleExcelWriter::create($tempPath);
                
                $this->fetchData($key, function($chunk) use ($writer) {
                    foreach ($chunk as $row) {
                        $writer->addRow($row);
                    }
                });

                $writer->close();
                $fileData = base64_encode(file_get_contents($tempPath));
                @unlink($tempPath);
            } else if ($format === 'pdf') {
                $rows = [];
                $this->fetchData($key, function($chunk) use (&$rows) {
                    $rows = array_merge($rows, $chunk);
                });
                $pdf = Pdf::loadView('reports.pdf', ['key' => $key, 'rows' => $rows]);
                $fileData = base64_encode($pdf->output());
            }

            $this->exportJob->update([
                'status' => 'completed',
                'file_data' => $fileData ?? null,
                'file_path' => $filename,
            ]);

            broadcast(new ExportCompleted($this->exportJob))->toOthers();

        } catch (\Throwable $e) {
            $this->exportJob->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);
        }
    }

    private function fetchData(string $key, callable $chunkCallback): void
    {
        $filters = $this->exportJob->filters ?? [];
        $hasManage = $filters['_has_manage'] ?? false;
        $departmentId = $filters['_department_id'] ?? null;
        $userId = $filters['_user_id'] ?? null;
        $search = $filters['search'] ?? null;

        switch ($key) {
            case 'tasks':
                $query = Task::with(['project', 'assignee']);
                if ($search) {
                    $query->where('title', 'ilike', '%' . $search . '%');
                }
                if (!$hasManage) {
                    $query->where(function ($q) use ($userId) {
                        $q->where('assignee_id', $userId)
                          ->orWhere('reporter_id', $userId);
                    });
                }
                $query->chunk(1000, function($chunk) use ($chunkCallback) {
                    $chunkCallback($chunk->map(fn($t) => [
                        'ID' => $t->id,
                        'Title' => $t->title,
                        'Project' => $t->project?->name ?? 'N/A',
                        'Assignee' => $t->assignee?->name ?? 'Unassigned',
                        'Status' => $t->status,
                        'Priority' => $t->priority,
                        'Due Date' => $t->due_date ? $t->due_date->format('Y-m-d') : 'None',
                    ])->toArray());
                });
                break;

            case 'projects':
                $query = Project::with(['creator', 'members']);
                if ($search) {
                    $query->where('name', 'ilike', '%' . $search . '%');
                }
                if (!$hasManage) {
                    $query->where(function ($q) use ($userId) {
                        $q->where('created_by', $userId)
                          ->orWhereHas('members', fn ($m) => $m->where('users.id', $userId));
                    });
                }
                $query->chunk(1000, function($chunk) use ($chunkCallback) {
                    $chunkCallback($chunk->map(fn($p) => [
                        'ID' => $p->id,
                        'Name' => $p->name,
                        'Owner' => $p->creator?->name ?? 'N/A',
                        'Status' => $p->status,
                        'Budget' => $p->budget,
                    ])->toArray());
                });
                break;

            case 'departments':
                $query = Department::withCount('users')->with('teams');
                if ($search) {
                    $query->where('name', 'ilike', '%' . $search . '%');
                }
                $status = $filters['status'] ?? null;
                if ($status === 'active') {
                    $query->where('is_active', true);
                } elseif ($status === 'archived') {
                    $query->onlyTrashed();
                } elseif ($status === 'inactive') {
                    $query->where('is_active', false);
                }
                
                $query->chunk(1000, function($chunk) use ($chunkCallback) {
                    $chunkCallback($chunk->map(fn($d) => [
                        'ID' => $d->id,
                        'Name' => $d->name,
                        'Description' => $d->description,
                        'Members Count' => $d->users_count ?? 0,
                        'Is Active' => $d->is_active ? 'Yes' : 'No',
                        'Archived At' => $d->deleted_at ? $d->deleted_at->format('Y-m-d H:i:s') : 'N/A',
                        'Created At' => $d->created_at->format('Y-m-d H:i:s'),
                    ])->toArray());
                });
                break;

            case 'designations':
                $query = Designation::withCount('users');
                if ($search) {
                    $query->where('name', 'ilike', '%' . $search . '%');
                }
                $status = $filters['status'] ?? null;
                if ($status === 'active') {
                    $query->where('is_active', true);
                } elseif ($status === 'inactive') {
                    $query->where('is_active', false);
                }

                $query->chunk(1000, function($chunk) use ($chunkCallback) {
                    $chunkCallback($chunk->map(fn($d) => [
                        'ID' => $d->id,
                        'Name' => $d->name,
                        'Description' => $d->description,
                        'Members Count' => $d->users_count ?? 0,
                        'Status' => $d->is_active ? 'Active' : 'Inactive',
                        'Created At' => $d->created_at->format('Y-m-d H:i:s'),
                    ])->toArray());
                });
                break;

            case 'attendance-export':
                $start = $filters['start_date'] ?? now()->toDateString();
                $end = $filters['end_date'] ?? now()->toDateString();
                
                $query = \Illuminate\Support\Facades\DB::table('attendance_days')
                    ->join('users', 'users.id', '=', 'attendance_days.user_id')
                    ->select('attendance_days.*', 'users.name as user_name', 'users.email as user_email', 'users.department_id')
                    ->whereBetween('date', [$start, $end])
                    ->orderBy('date', 'asc');
                    
                if (!empty($filters['ids'])) {
                    $query->whereIn('attendance_days.id', explode(',', $filters['ids']));
                }
                if (!empty($filters['department_id'])) {
                    $query->where('users.department_id', $filters['department_id']);
                }
                if (!empty($filters['user_id'])) {
                    $query->where('users.id', $filters['user_id']);
                }
                if (!empty($filters['search'])) {
                    $search = $filters['search'];
                    $query->where(fn($sub) => 
                        $sub->where('users.name', 'ilike', "%{$search}%")
                            ->orWhere('users.email', 'ilike', "%{$search}%")
                    );
                }

                if (!$hasManage) {
                    $query->where('users.id', $userId);
                } else {
                    // HR scoping logic inline or duplicated since we're in a job
                    // Simplified: if HR, only their department (assuming $departmentId is set if they are HR, else they see all)
                    $hrRole = \Illuminate\Support\Facades\DB::table('role_assignments')->where('user_id', $userId)->pluck('role')->toArray();
                    if (!in_array('super_admin', $hrRole) && in_array('hr', $hrRole) && $departmentId) {
                        $query->where('users.department_id', $departmentId);
                    }
                }

                $query->chunk(1000, function($chunk) use ($chunkCallback) {
                    $chunkCallback($chunk->map(function($row) {
                        $hours = floor($row->total_seconds / 3600);
                        $mins = floor(($row->total_seconds % 3600) / 60);
                        $otHours = floor($row->overtime_seconds / 3600);
                        $otMins = floor(($row->overtime_seconds % 3600) / 60);

                        return [
                            'Date' => $row->date,
                            'Employee Name' => $row->user_name,
                            'Email' => $row->user_email,
                            'Status' => strtoupper($row->status),
                            'Total Worked (hh:mm)' => sprintf('%02dh %02dm', $hours, $mins),
                            'Overtime (hh:mm)' => sprintf('%02dh %02dm', $otHours, $otMins),
                            'Late (mins)' => $row->late_minutes,
                        ];
                    })->toArray());
                });
                break;

            case 'leave-export':
                $query = \App\Models\LeaveRequest::with(['approval', 'user']);

                if (!$hasManage) {
                    $query->where('user_id', $userId);
                } else {
                    $hrRole = \Illuminate\Support\Facades\DB::table('role_assignments')->where('user_id', $userId)->pluck('role')->toArray();
                    if (!in_array('super_admin', $hrRole) && in_array('hr', $hrRole) && $departmentId) {
                        $query->whereHas('user', function($q) use ($departmentId) {
                            $q->where('department_id', $departmentId);
                        });
                    }
                }

                if (!empty($filters['status'])) {
                    $status = $filters['status'];
                    $query->whereHas('approval', function($q) use ($status) {
                        $q->where('status', $status);
                    });
                }
                
                if (!empty($filters['type'])) {
                    $query->where('type', $filters['type']);
                }

                $query->orderBy('created_at', 'desc');

                $query->chunk(1000, function($chunk) use ($chunkCallback) {
                    $chunkCallback($chunk->map(fn($leave) => [
                        'ID' => $leave->id,
                        'Employee Name' => $leave->user->name ?? 'Unknown',
                        'Employee Email' => $leave->user->email ?? 'Unknown',
                        'Leave Type' => ucfirst($leave->type),
                        'Start Date' => $leave->start_date,
                        'End Date' => $leave->end_date,
                        'Reason' => $leave->reason,
                        'Status' => ucfirst($leave->approval->status ?? 'pending'),
                        'Submitted At' => $leave->created_at->format('Y-m-d H:i:s'),
                    ])->toArray());
                });
                break;
                $start = $filters['start'] ?? now()->subDays(30)->toDateString();
                $end = $filters['end'] ?? now()->toDateString();
                $dept = $filters['dept'] ?? null;

                $query = User::with('department')
                    ->withCount([
                        'attendanceDays as present_days' => fn($q) => $q->where('status', 'present')->whereBetween('date', [$start, $end]),
                        'attendanceDays as late_days' => fn($q) => $q->where('status', 'late')->whereBetween('date', [$start, $end]),
                        'attendanceDays as absent_days' => fn($q) => $q->where('status', 'absent')->whereBetween('date', [$start, $end]),
                        'attendanceDays as leave_days' => fn($q) => $q->where('status', 'leave')->whereBetween('date', [$start, $end]),
                    ])
                    ->withSum(['attendanceDays as total_seconds' => fn($q) => $q->whereBetween('date', [$start, $end])], 'total_seconds');

                if (!$hasManage) {
                    $query->where('id', $userId);
                } elseif ($dept && $dept !== 'all') {
                    $query->where('department_id', $dept);
                }

                $query->chunk(1000, function($chunk) use ($chunkCallback) {
                    $chunkCallback($chunk->map(fn($u) => [
                        'Name' => $u->name,
                        'Department' => $u->department?->name ?? 'N/A',
                        'Present Days' => $u->present_days,
                        'Late Days' => $u->late_days,
                        'Absent Days' => $u->absent_days,
                        'Leave Days' => $u->leave_days,
                        'Total Hours' => round(($u->total_seconds ?? 0) / 3600, 2),
                    ])->toArray());
                });
                break;

            case 'leave-summary':
                $start = $filters['start'] ?? now()->subDays(30)->toDateString();
                $end = $filters['end'] ?? now()->toDateString();
                $dept = $filters['dept'] ?? null;

                $query = User::with('department')
                    ->withCount([
                        'leaveRequests as total_requests' => fn($q) => $q->whereBetween('start_date', [$start, $end]),
                        'leaveRequests as approved_requests' => fn($q) => $q->where('status', 'approved')->whereBetween('start_date', [$start, $end]),
                        'leaveRequests as pending_requests' => fn($q) => $q->where('status', 'pending')->whereBetween('start_date', [$start, $end]),
                        'leaveRequests as rejected_requests' => fn($q) => $q->where('status', 'rejected')->whereBetween('start_date', [$start, $end]),
                    ]);

                if (!$hasManage) {
                    $query->where('id', $userId);
                } elseif ($dept && $dept !== 'all') {
                    $query->where('department_id', $dept);
                }

                $query->chunk(1000, function($chunk) use ($chunkCallback) {
                    $chunkCallback($chunk->map(fn($u) => [
                        'Name' => $u->name,
                        'Department' => $u->department?->name ?? 'N/A',
                        'Total Requests' => $u->total_requests,
                        'Approved' => $u->approved_requests,
                        'Pending' => $u->pending_requests,
                        'Rejected' => $u->rejected_requests,
                    ])->toArray());
                });
                break;

            case 'users':
            case 'productivity':
                $query = User::with(['department', 'roleAssignments']);
                if ($search) {
                    $query->where('name', 'ilike', '%' . $search . '%');
                }
                if (!$hasManage) {
                    $query->where('id', $userId);
                }
                if (!empty($filters['ids'])) {
                    $query->whereIn('id', is_array($filters['ids']) ? $filters['ids'] : explode(',', $filters['ids']));
                }
                
                if ($key === 'productivity') {
                    $query->withCount([
                        'assignedTasks as completed_tasks' => fn($q) => $q->where('status', 'done'),
                        'assignedTasks as total_tasks',
                    ])->withSum('taskTimeLogs as total_minutes', 'minutes_logged');
                }
                
                $query->chunk(1000, function($chunk) use ($chunkCallback, $key) {
                    if ($key === 'productivity') {
                        $chunk->transform(function($u) {
                            $rate = $u->total_tasks > 0 ? ($u->completed_tasks / $u->total_tasks) : 0;
                            $hours = ($u->total_minutes ?? 0) / 60;
                            $u->productivity_score = round($rate * $hours, 2);
                            return $u;
                        });
                    }

                    $chunkCallback($chunk->map(fn($u) => [
                        'ID' => $u->id,
                        'Name' => $u->name,
                        'Email' => $u->email,
                        'Role' => $u->roleAssignments->pluck('role')->join(', ') ?: 'employee',
                        'Department' => $u->department?->name ?? 'N/A',
                        'Productivity Score' => $key === 'productivity' ? $u->productivity_score : 'N/A',
                    ])->toArray());
                });
                break;

            default:
                throw new \Exception("Invalid report key: {$key}");
        }
    }
}
