<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ReconcileMigrations extends Command
{
    protected $signature = 'app:reconcile-migrations';
    protected $description = 'Insert schema-present-but-Pending rows into migrations table';

    public function handle()
    {
        $files = glob(database_path('migrations/*.php'));
        $ran = DB::table('migrations')->pluck('migration')->toArray();
        $batch = DB::table('migrations')->max('batch') + 1;

        $inserted = 0;
        foreach ($files as $file) {
            $migration = basename($file, '.php');
            if (in_array($migration, $ran)) continue;

            $content = file_get_contents($file);
            $shouldInsert = false;
            
            if (preg_match('/Schema::create\(\s*\'([^\']+)\'/', $content, $matches)) {
                $table = $matches[1];
                if (Schema::hasTable($table)) {
                    $this->info("Table {$table} exists. Marking {$migration} as ran.");
                    $shouldInsert = true;
                } else {
                    $this->warn("Table {$table} missing. Leaving {$migration} pending.");
                }
            } elseif (preg_match('/Schema::table\(\s*\'([^\']+)\'/', $content, $matches)) {
                $table = $matches[1];
                if (preg_match('/\$table->(?:string|boolean|timestamp|integer|foreignId|enum|text|json|date|decimal)\(\s*\'([^\']+)\'/', $content, $colMatches)) {
                    $column = $colMatches[1];
                    if (Schema::hasTable($table) && Schema::hasColumn($table, $column)) {
                        $this->info("Column {$table}.{$column} exists. Marking {$migration} as ran.");
                        $shouldInsert = true;
                    } else {
                        $this->warn("Column {$table}.{$column} missing. Leaving {$migration} pending.");
                    }
                } else {
                    $this->info("Could not detect column for table {$table}. Marking {$migration} as ran for safety if table exists.");
                    if (Schema::hasTable($table)) {
                        $shouldInsert = true;
                    }
                }
            } else {
                $this->warn("Could not parse {$migration}. Assuming ran for safety.");
                $shouldInsert = true;
            }

            if ($shouldInsert) {
                DB::table('migrations')->insert([
                    'migration' => $migration,
                    'batch' => $batch
                ]);
                $inserted++;
            }
        }
        
        $this->info("Done reconciling migrations. Inserted {$inserted} pending migrations into table.");
    }
}
