<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Holiday;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class IndianHolidaysSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $currentYear = date('Y');
        
        $holidays = [
            ['name' => 'New Year\'s Day', 'date' => "$currentYear-01-01", 'recurring' => true, 'description' => 'New Year\'s Day'],
            ['name' => 'Republic Day', 'date' => "$currentYear-01-26", 'recurring' => true, 'description' => 'Republic Day of India'],
            ['name' => 'Independence Day', 'date' => "$currentYear-08-15", 'recurring' => true, 'description' => 'Independence Day of India'],
            ['name' => 'Gandhi Jayanti', 'date' => "$currentYear-10-02", 'recurring' => true, 'description' => 'Mahatma Gandhi\'s Birthday'],
            ['name' => 'Christmas Day', 'date' => "$currentYear-12-25", 'recurring' => true, 'description' => 'Christmas Day'],
            // Dynamic holidays (seed just for current year as non-recurring or pick exact dates for current year)
            // For simplicity in the seeder we will just seed the fixed recurring holidays.
        ];

        foreach ($holidays as $holiday) {
            Holiday::updateOrCreate(
                ['date' => $holiday['date']],
                $holiday
            );
        }
    }
}
