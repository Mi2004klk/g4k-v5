<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('reports:cleanup-exports')]
#[Description('Cleans up export jobs and their generated files older than 30 days')]
class CleanupExports extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $cutoff = now()->subDays(30);
        $disk = \Illuminate\Support\Facades\Storage::disk(config('filesystems.default'));

        $jobs = \App\Models\ExportJob::where('created_at', '<', $cutoff)->get();

        $count = 0;
        foreach ($jobs as $job) {
            if ($job->file_path && $disk->exists($job->file_path)) {
                $disk->delete($job->file_path);
            }
            $job->delete();
            $count++;
        }

        $this->info("Cleaned up {$count} old export jobs.");
    }
}
