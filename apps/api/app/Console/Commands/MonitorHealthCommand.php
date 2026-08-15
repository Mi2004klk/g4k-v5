<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MonitorHealthCommand extends Command
{
    protected $signature = 'monitor:health {--test-alert : Fire a test alert}';
    protected $description = 'Probes system health (queue depth, failed jobs, DB connection) and triggers alerts if thresholds are exceeded.';

    public function handle()
    {
        if ($this->option('test-alert')) {
            Log::emergency('MONITORING_TEST_ALERT: Triggering test alert for Phase 39 verification.');
            $this->info('Test alert fired to Cloud Logging.');
            return 0;
        }

        $errors = [];

        // 1. DB Connection
        try {
            DB::connection()->getPdo();
        } catch (\Exception $e) {
            $errors[] = "Database connection failed: " . $e->getMessage();
        }

        // 2. Failed Jobs
        if (DB::getSchemaBuilder()->hasTable('failed_jobs')) {
            $failedCount = DB::table('failed_jobs')->count();
            if ($failedCount > 0) {
                $errors[] = "Failed jobs detected: {$failedCount} jobs require attention.";
            }
        }

        // 3. Queue Depth (Assuming default 'jobs' table for database queue)
        if (DB::getSchemaBuilder()->hasTable('jobs')) {
            $queueDepth = DB::table('jobs')->count();
            if ($queueDepth > 100) {
                $errors[] = "High queue depth detected: {$queueDepth} jobs pending.";
            }
        }

        if (!empty($errors)) {
            $errorMsg = "SYSTEM_HEALTH_DEGRADED: " . implode(' | ', $errors);
            Log::critical($errorMsg);
            $this->error($errorMsg);
            return 1;
        }

        $this->info("System health OK.");
        return 0;
    }
}
