<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Setting;

class SmtpSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $defaults = [
            ['category' => 'mail', 'key' => 'from_address', 'value' => config('mail.from.address', 'hello@games4king.in')],
            ['category' => 'mail', 'key' => 'from_name',    'value' => config('mail.from.name', 'Games4King')],
            ['category' => 'mail', 'key' => 'host',         'value' => ''],
            ['category' => 'mail', 'key' => 'port',         'value' => '587'],
            ['category' => 'mail', 'key' => 'encryption',   'value' => 'tls'],
            ['category' => 'mail', 'key' => 'username',     'value' => ''],
            ['category' => 'mail', 'key' => 'password',     'value' => ''],
            ['category' => 'mail', 'key' => 'timeout',      'value' => '30'],
        ];

        foreach ($defaults as $row) {
            Setting::firstOrCreate(
                ['category' => 'mail', 'key' => $row['key']],
                ['value' => $row['value']]
            );
        }
    }
}
