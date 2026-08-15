<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use App\Models\Setting;

class DemoSeedCommand extends Command
{
    protected $signature = 'demo:seed {--fresh : Run demo:purge before seeding}';
    protected $description = 'Seed the database with a versioned demo dataset using real services and tagged rows';

    public function handle()
    {
        // Disable broadcasting during seed to prevent local cURL SSL errors
        config(['broadcasting.default' => 'log']);

        if ($this->option('fresh')) {
            $this->info('Running teardown before seeding...');
            Artisan::call('demo:purge');
        }

        $version = 'v2.0.0';
        $existing = Setting::where('key', 'demo_dataset_version')->first();
        
        if ($existing && $existing->value === $version && !$this->option('fresh')) {
            $this->info('Demo data already seeded for this version. Use --fresh to reseed.');
            return 0;
        }

        $demoTag = Str::uuid()->toString();
        app()->instance('demo_tag', $demoTag);

        $this->info("Starting demo seed with tag: {$demoTag}");

        try {
            // Do not use DB::transaction because long-running seeds on remote poolers will timeout.
            Artisan::call('db:seed', ['--force' => true]);
            $this->info('System DB seeder finished (Org & Config).');

            // Append explicit demo tag seeder
            Artisan::call('db:seed', ['--class' => 'Phase42DemoSeeder', '--force' => true]);
            $this->info('Phase 42 Demo Seeder finished (Data & Comms).');
            
            Setting::updateOrCreate(
                ['key' => 'demo_dataset_version'],
                ['value' => $version, 'category' => 'system']
            );

            $this->info('Demo dataset seeded successfully.');
            return 0;
        } finally {
            app()->forgetInstance('demo_tag');
        }
    }
}
