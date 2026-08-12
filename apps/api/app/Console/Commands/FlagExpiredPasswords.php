<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class FlagExpiredPasswords extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'passwords:expire-flag';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Flags users with expired passwords forcing them to change it on next action.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $expiryDays = DB::table('settings')->where('category', 'security')->where('key', 'password.expiry_days')->value('value');
        
        if ($expiryDays === null || $expiryDays === 'null' || $expiryDays === '') {
            $this->info('Password expiry is not configured or disabled.');
            return;
        }

        $expiryDays = (int) $expiryDays;
        $thresholdDate = Carbon::now()->subDays($expiryDays);

        $affected = User::where('must_change_password', false)
            ->where(function($query) use ($thresholdDate) {
                $query->whereNotNull('password_changed_at')
                      ->where('password_changed_at', '<', $thresholdDate)
                      ->orWhere(function($q) use ($thresholdDate) {
                          $q->whereNull('password_changed_at')
                            ->where('updated_at', '<', $thresholdDate);
                      });
            })
            ->update(['must_change_password' => true]);

        $this->info("Flagged {$affected} users for mandatory password change.");
    }
}
