<?php

namespace App\Jobs;

use App\Models\ExportJob;
use App\Models\User;
use App\Models\Task;
use App\Models\Project;
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
            $rows = $this->fetchData($key);

            $disk = Storage::disk(config('filesystems.default', 'public'));

            if ($format === 'xlsx' || $format === 'csv') {
                $tempPath = sys_get_temp_dir() . '/' . uniqid('exp_') . ".{$format}";
                $writer = SimpleExcelWriter::create($tempPath);
                foreach ($rows as $row) {
                    $writer->addRow($row);
                }
                $writer->close();
                $disk->put($filename, file_get_contents($tempPath));
                @unlink($tempPath);
            } else if ($format === 'pdf') {
                $pdf = Pdf::loadView('reports.pdf', ['key' => $key, 'rows' => $rows]);
                $disk->put($filename, $pdf->output());
            }

            $url = $disk->url($filename);

            $this->exportJob->update([
                'status' => 'completed',
                'file_path' => $url,
            ]);

            broadcast(new ExportCompleted($this->exportJob))->toOthers();

        } catch (\Throwable $e) {
            $this->exportJob->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);
        }
    }

    private function fetchData(string $key): array
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
                return $query->get()->map(fn($t) => [
                    'ID' => $t->id,
                    'Title' => $t->title,
                    'Project' => $t->project?->name ?? 'N/A',
                    'Assignee' => $t->assignee?->name ?? 'Unassigned',
                    'Status' => $t->status,
                    'Priority' => $t->priority,
                    'Due Date' => $t->due_date ? $t->due_date->format('Y-m-d') : 'None',
                ])->toArray();

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
                return $query->get()->map(fn($p) => [
                    'ID' => $p->id,
                    'Name' => $p->name,
                    'Owner' => $p->creator?->name ?? 'N/A',
                    'Status' => $p->status,
                    'Budget' => $p->budget,
                ])->toArray();

            case 'attendance-summary':
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

                if ($dept && $dept !== 'all') {
                    $query->where('department_id', $dept);
                } elseif (!$hasManage) {
                    $query->where('department_id', $departmentId);
                }

                return $query->get()->map(fn($u) => [
                    'Name' => $u->name,
                    'Department' => $u->department?->name ?? 'N/A',
                    'Present Days' => $u->present_days,
                    'Late Days' => $u->late_days,
                    'Absent Days' => $u->absent_days,
                    'Leave Days' => $u->leave_days,
                    'Total Hours' => round(($u->total_seconds ?? 0) / 3600, 2),
                ])->toArray();

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

                if ($dept && $dept !== 'all') {
                    $query->where('department_id', $dept);
                } elseif (!$hasManage) {
                    $query->where('department_id', $departmentId);
                }

                return $query->get()->map(fn($u) => [
                    'Name' => $u->name,
                    'Department' => $u->department?->name ?? 'N/A',
                    'Total Requests' => $u->total_requests,
                    'Approved' => $u->approved_requests,
                    'Pending' => $u->pending_requests,
                    'Rejected' => $u->rejected_requests,
                ])->toArray();

            case 'users':
            case 'productivity':
            default:
                $query = User::with(['department', 'roleAssignments']);
                if ($search) {
                    $query->where('name', 'ilike', '%' . $search . '%');
                }
                if (!$hasManage) {
                    $query->where('department_id', $departmentId);
                }
                
                if ($key === 'productivity') {
                    $query->withCount([
                        'assignedTasks as completed_tasks' => fn($q) => $q->where('status', 'completed'),
                        'assignedTasks as total_tasks',
                    ])->withSum('taskTimeLogs as total_seconds', 'duration_seconds');
                }
                
                $data = $query->get();
                
                if ($key === 'productivity') {
                    $data->transform(function($u) {
                        $rate = $u->total_tasks > 0 ? ($u->completed_tasks / $u->total_tasks) : 0;
                        $hours = ($u->total_seconds ?? 0) / 3600;
                        $u->productivity_score = round($rate * $hours, 2);
                        return $u;
                    });
                }

                return $data->map(fn($u) => [
                    'ID' => $u->id,
                    'Name' => $u->name,
                    'Email' => $u->email,
                    'Role' => $u->roleAssignments->pluck('role')->join(', ') ?: 'employee',
                    'Department' => $u->department?->name ?? 'N/A',
                    'Productivity Score' => $key === 'productivity' ? $u->productivity_score : 'N/A',
                ])->toArray();
        }
    }
}
