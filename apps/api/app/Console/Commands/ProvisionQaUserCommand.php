<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class ProvisionQaUserCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'qa:provision';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Provision a smoke-test QA credential';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $user = User::updateOrCreate(
            ['email' => 'test@games4kings.com'],
            [
                'name' => 'QA Tester',
                'password' => Hash::make('password123'),
                'status' => 'active',
                'role' => 'admin',
                'onboarding_completed' => true
            ]
        );

        $this->info("QA user {$user->email} provisioned with password: password123");
    }
}
