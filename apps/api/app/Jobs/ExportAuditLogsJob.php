<?php

namespace App\Jobs;

use App\Models\ExportJob;
use App\Models\AuditLog;
use App\Events\ExportCompleted;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Spatie\SimpleExcel\SimpleExcelWriter;

class ExportAuditLogsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $exportJob;
    public $filters;

    public function __construct(ExportJob $exportJob, array $filters = [])
    {
        $this->exportJob = $exportJob;
        $this->filters = $filters;
    }

    public function handle(): void
    {
        try {
            $this->exportJob->update(['status' => 'processing']);

            $query = AuditLog::with('user')->latest('at');

            if (!empty($this->filters['user_id'])) {
                if ($this->filters['user_id'] === 'system') {
                    $query->whereNull('user_id');
                } else {
                    $query->where('user_id', $this->filters['user_id']);
                }
            }
            if (!empty($this->filters['action'])) {
                $query->where('action', $this->filters['action']);
            }
            if (!empty($this->filters['start_date']) && !empty($this->filters['end_date'])) {
                $query->whereBetween('at', [$this->filters['start_date'], $this->filters['end_date']]);
            }

            $disk = Storage::disk(config('filesystems.default', 'public'));
            $filename = "exports/audit_logs_" . time() . ".csv";
            $tempPath = sys_get_temp_dir() . '/' . uniqid('audit_') . ".csv";

            $writer = SimpleExcelWriter::create($tempPath);
            $writer->addHeader(['ID', 'Action', 'User', 'Subject Type', 'Subject ID', 'Before', 'After', 'IP', 'Meta', 'Timestamp']);

            $query->chunk(1000, function ($logs) use ($writer) {
                foreach ($logs as $log) {
                    $writer->addRow([
                        $log->id,
                        $this->escapeCsvField($log->action),
                        $this->escapeCsvField($log->user ? $log->user->name : 'System'),
                        $this->escapeCsvField($log->subject_type),
                        $this->escapeCsvField((string)$log->subject_id),
                        $this->escapeCsvField(json_encode($log->before)),
                        $this->escapeCsvField(json_encode($log->after)),
                        $this->escapeCsvField($log->ip),
                        $this->escapeCsvField(json_encode($log->meta)),
                        $log->at,
                    ]);
                }
            });

            $writer->close();
            $disk->put($filename, file_get_contents($tempPath));
            @unlink($tempPath);

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

    private function escapeCsvField(?string $field): string
    {
        if ($field === null) {
            return '';
        }
        // Prevent CSV injection by escaping fields starting with =, +, -, or @
        if (preg_match('/^[=\-+@]/', $field)) {
            return "'" . $field;
        }
        return $field;
    }
}
