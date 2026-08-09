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
            $fullPath = storage_path("app/public/{$filename}");

            // Ensure directory exists
            if (!file_exists(storage_path("app/public/exports"))) {
                mkdir(storage_path("app/public/exports"), 0755, true);
            }

            $rows = $this->fetchData($key);

            if ($format === 'xlsx' || $format === 'csv') {
                $writer = SimpleExcelWriter::create($fullPath);
                foreach ($rows as $row) {
                    $writer->addRow($row);
                }
            } else if ($format === 'pdf') {
                $pdf = Pdf::loadView('reports.pdf', ['key' => $key, 'rows' => $rows]);
                $pdf->save($fullPath);
            }

            $url = Storage::url($filename);

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
        switch ($key) {
            case 'tasks':
                return Task::with(['project', 'assignee'])
                    ->get()
                    ->map(fn($t) => [
                        'ID' => $t->id,
                        'Title' => $t->title,
                        'Project' => $t->project?->name ?? 'N/A',
                        'Assignee' => $t->assignee?->name ?? 'Unassigned',
                        'Status' => $t->status,
                        'Priority' => $t->priority,
                        'Due Date' => $t->due_date ? $t->due_date->format('Y-m-d') : 'None',
                    ])->toArray();

            case 'projects':
                return Project::with('owner')
                    ->get()
                    ->map(fn($p) => [
                        'ID' => $p->id,
                        'Name' => $p->name,
                        'Owner' => $p->owner?->name ?? 'N/A',
                        'Status' => $p->status,
                        'Budget' => $p->budget,
                    ])->toArray();

            case 'users':
            case 'productivity':
            default:
                return User::get()
                    ->map(fn($u) => [
                        'ID' => $u->id,
                        'Name' => $u->name,
                        'Email' => $u->email,
                        'Role' => $u->role,
                        'Department' => $u->department?->name ?? 'N/A',
                    ])->toArray();
        }
    }
}
