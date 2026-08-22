<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Company;
use App\Models\Department;
use App\Models\Designation;
use App\Models\AutoNumbering;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Models\Conversation;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 0. Capabilities
        $capabilities = [
            '*',
            'attendance.clock-self',
            'hr.view-team-attendance',
            'admin.view-all-attendance',
            'admin.correct-attendance',
            'attendance.correct-team',
            'leave.request-self',
            'leave.approve-employee',
            'leave.approve-hr',
            'chat.access',
            'chat.manage',
            'settings.manage',
            'audit.view',
            'users.hr.manage',
            'users.employee.manage',
            'departments.manage',
            'designations.manage',
            'directory.view',
            'directory.send-message',
            'profile.edit',
            'announcements.manage',
            'tasks.view',
            'tasks.manage',
            'tasks.create-own',
            'projects.view',
            'projects.manage',
            'qa.view',
            'qa.manage',
            'timer.track',
            'reports.view',
            'reports.manage'
        ];

        foreach ($capabilities as $cap) {
            DB::table('capabilities')->updateOrInsert(['key' => $cap], ['description' => $cap, 'group' => 'general', 'created_at' => now(), 'updated_at' => now()]);
        }

        $roleCaps = [
            'super_admin' => ['*'],
            'hr' => [
                'attendance.clock-self',
                'hr.view-team-attendance', 'attendance.correct-team', 'leave.approve-employee',
                'users.employee.manage', 'directory.view', 'directory.send-message', 'chat.access',
                'profile.edit', 'leave.request-self', 'timer.track', 'announcements.manage', 'tasks.view', 'tasks.manage', 'tasks.create-own', 'chat.manage', 'projects.view', 'reports.view', 'projects.manage', 'qa.view', 'qa.manage', 'departments.manage', 'designations.manage'
            ],
            'employee' => [
                'attendance.clock-self', 'leave.request-self', 'profile.edit',
                'chat.access', 'tasks.view', 'tasks.create-own', 'projects.view', 'timer.track'
            ]
        ];

        // Clear existing capability assignments first so we don't have orphan old capabilities assigned to roles
        DB::table('role_capabilities')->truncate();
        DB::table('capabilities')->whereNotIn('key', $capabilities)->delete();

        foreach ($roleCaps as $role => $caps) {
            foreach ($caps as $cap) {
                DB::table('role_capabilities')->updateOrInsert(['role' => $role, 'capability_key' => $cap], ['created_at' => now(), 'updated_at' => now()]);
            }
        }

        \App\Services\CapabilityMatrix::clearCache();

        // 1. AutoNumbering Configuration
        AutoNumbering::firstOrCreate(
            ["entity_type" => "company"],
            ["prefix" => "G4K-", "start_number" => 1, "current_number" => 0, "format" => "{PREFIX}{000}"]
        );
        AutoNumbering::firstOrCreate(
            ["entity_type" => "department"],
            ["prefix" => "DEP", "start_number" => 1, "current_number" => 0, "format" => "{PREFIX}{000}"]
        );
        AutoNumbering::firstOrCreate(
            ["entity_type" => "employee"],
            ["prefix" => "G4K", "start_number" => 1, "current_number" => 0, "format" => "{PREFIX}{000}"]
        );

        // 1.5 Work Schedules (Default G4K Schedule)
        DB::table('work_schedules')->updateOrInsert(
            ['name' => 'Standard G4K Schedule'],
            [
                'start_time' => '09:00:00',
                'end_time' => '18:30:00',
                'break_minutes' => 45,
                'grace_minutes' => 10,
                'standard_seconds' => 31500, // 8h 45m
                'working_days' => json_encode([1, 2, 3, 4, 5, 6]), // Mon-Sat
                'effective_from' => '2026-01-01',
                'is_default' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        // 2. Company
        $company = Company::firstOrCreate(
            ["name" => "Games4King"],
            [
                "short_name" => "G4K",
                "type" => "Game Development Studio",
                "description" => "Games4King is a creative game development studio specializing in designing, developing, and publishing high-quality Web and Android Games, including Puzzle, Escape, Adventure, Casual, and Interactive Gaming Experiences.",
                "primary_phone" => "+91 79045 93823",
                "secondary_phone" => "+91 96264 79882",
                "email" => "g4kasset@gmail.com",
                "address" => "Mullai Nagar, Vadamalampatti, Pochampalli Tk, Krishnagiri Dt, Tamil Nadu - 635206",
            ]
        );

        // 3. Departments
        $deptGame = Department::firstOrCreate(["name" => "Game Dev Team"], ["company_id" => $company->id]);
        $deptYouTube = Department::firstOrCreate(["name" => "YouTube Team"], ["company_id" => $company->id]);
        $deptMarketing = Department::firstOrCreate(["name" => "Marketing & Growth"], ["company_id" => $company->id]);

        // 4. Designations
        $designations = [
            "Senior Head", "HR Manager", "Senior Developer", "Unity Developer", "Lead UI Designer",
            "Graphic Designer", "Creative Director", "Video Production Lead", "Video Editor",
            "Camera Operator", "Content Artist", "Digital Marketer", "Marketing Executive",
            "Game Tester" // Keeping extra just in case
        ];

        $desigMap = [];
        foreach ($designations as $d) {
            $desigMap[$d] = Designation::firstOrCreate(["name" => $d], ["company_id" => $company->id]);
        }

        // 5. Employees
        $employees = [
            [
                "name" => "Karthik R", "username" => "karthik", "email" => "g4kkarthik@gmail.com",
                "password" => "Admin@123", "dept" => $deptYouTube->id, "roles" => ["super_admin"],
                "designation" => "Senior Head", "mobile" => "7708219011", "alt_mobile" => "6380847411",
                "emergency" => "7092966257", "joining_date" => "2020-09-01", "blood_group" => "B+",
                "working_hours" => "09:00 AM - 06:30 PM"
            ],
            [
                "name" => "Aravind Kumar", "username" => "aravind", "email" => "hr@games4king.in",
                "password" => "Hr@123", "dept" => $deptYouTube->id, "roles" => ["hr"],
                "designation" => "HR Manager", "mobile" => "9786543210", "alt_mobile" => null,
                "emergency" => null, "joining_date" => "2022-01-15", "blood_group" => "O+",
                "working_hours" => "09:00 AM - 06:30 PM"
            ],
            [
                "name" => "Praveen Kumar", "username" => "praveen", "email" => "praveen@games4king.in",
                "password" => "Dev@123", "dept" => $deptGame->id, "roles" => ["employee"],
                "designation" => "Senior Developer", "mobile" => "9876543201", "alt_mobile" => null,
                "emergency" => null, "joining_date" => "2021-04-04", "blood_group" => "A+",
                "working_hours" => "09:00 AM - 06:30 PM"
            ],
            [
                "name" => "Rahul S", "username" => "rahul", "email" => "rahul@games4king.in",
                "password" => "Dev@123", "dept" => $deptGame->id, "roles" => ["employee"],
                "designation" => "Unity Developer", "mobile" => "9876543202", "alt_mobile" => null,
                "emergency" => null, "joining_date" => "2023-08-21", "blood_group" => "O+",
                "working_hours" => "09:00 AM - 06:30 PM"
            ],
            [
                "name" => "Santhosh M", "username" => "santhosh", "email" => "santhosh@games4king.in",
                "password" => "Design@123", "dept" => $deptGame->id, "roles" => ["employee"],
                "designation" => "Graphic Designer", "mobile" => "9876543204", "alt_mobile" => null,
                "emergency" => null, "joining_date" => "2024-07-10", "blood_group" => "B+",
                "working_hours" => "09:00 AM - 06:30 PM"
            ],
            [
                "name" => "Harish Kumar", "username" => "harish", "email" => "harish@games4king.in",
                "password" => "Director@123", "dept" => $deptYouTube->id, "roles" => ["employee"],
                "designation" => "Creative Director", "mobile" => "9876543206", "alt_mobile" => null,
                "emergency" => null, "joining_date" => "2022-01-07", "blood_group" => "A+",
                "working_hours" => "09:00 AM - 06:30 PM"
            ],
            [
                "name" => "Dinesh Kumar", "username" => "dinesh", "email" => "dinesh@games4king.in",
                "password" => "Edit@123", "dept" => $deptYouTube->id, "roles" => ["employee"],
                "designation" => "Video Production Lead", "mobile" => "9876543207", "alt_mobile" => null,
                "emergency" => null, "joining_date" => "2022-05-20", "blood_group" => "B-",
                "working_hours" => "09:00 AM - 06:30 PM"
            ],
            [
                "name" => "Ajith Kumar", "username" => "ajith", "email" => "ajith@games4king.in",
                "password" => "Edit@123", "dept" => $deptYouTube->id, "roles" => ["employee"],
                "designation" => "Video Editor", "mobile" => "9876543208", "alt_mobile" => null,
                "emergency" => null, "joining_date" => "2023-12-05", "blood_group" => "O+",
                "working_hours" => "09:00 AM - 06:30 PM"
            ],
            [
                "name" => "Lokesh R", "username" => "lokesh", "email" => "lokesh@games4king.in",
                "password" => "Camera@123", "dept" => $deptYouTube->id, "roles" => ["employee"],
                "designation" => "Camera Operator", "mobile" => "9876543209", "alt_mobile" => null,
                "emergency" => null, "joining_date" => "2024-06-11", "blood_group" => "A-",
                "working_hours" => "09:00 AM - 06:30 PM"
            ],
            [
                "name" => "Akash Kumar", "username" => "akash", "email" => "akash@games4king.in",
                "password" => "Actor@123", "dept" => $deptYouTube->id, "roles" => ["employee"],
                "designation" => "Content Artist", "mobile" => "9876543210", "alt_mobile" => null,
                "emergency" => null, "joining_date" => "2024-03-01", "blood_group" => "B+",
                "working_hours" => "09:00 AM - 06:30 PM"
            ],
            [
                "name" => "Nivetha S", "username" => "nivetha", "email" => "nivetha@games4king.in",
                "password" => "Actress@123", "dept" => $deptYouTube->id, "roles" => ["employee"],
                "designation" => "Content Artist", "mobile" => "9876543211", "alt_mobile" => null,
                "emergency" => null, "joining_date" => "2024-04-14", "blood_group" => "O+",
                "working_hours" => "09:00 AM - 06:30 PM"
            ],
            [
                "name" => "Vignesh R", "username" => "vignesh", "email" => "vignesh@games4king.in",
                "password" => "Design@123", "dept" => $deptMarketing->id, "roles" => ["employee", "hr"],
                "designation" => "Digital Marketer", "mobile" => "9876543203", "alt_mobile" => null,
                "emergency" => null, "joining_date" => "2021-02-12", "blood_group" => "AB+",
                "working_hours" => "09:00 AM - 06:30 PM"
            ],
            [
                "name" => "Priya S", "username" => "newjoin", "email" => "priya@games4king.in",
                "password" => "NewJoin@123", "dept" => $deptMarketing->id, "roles" => ["employee"],
                "designation" => "Marketing Executive", "mobile" => "9876543333", "alt_mobile" => null,
                "emergency" => null, "joining_date" => date('Y-m-d'), "blood_group" => "A-",
                "working_hours" => "09:00 AM - 06:30 PM", "unonboarded" => true
            ]
        ];

        $scheduleId = DB::table('work_schedules')->where('name', 'Standard G4K Schedule')->value('id');

        foreach ($employees as $emp) {
            $isProd = false; // app()->environment('production'); // Disabled so demo passwords work on live
            $password = $isProd ? \Illuminate\Support\Str::random(16) : $emp["password"];
            
            $user = User::updateOrCreate(
                ["username" => $emp["username"]],
                [
                    "company_id" => $company->id,
                    "name" => $emp["name"],
                    "email" => $emp["email"],
                    "password" => Hash::make($password),
                    "must_change_password" => $isProd ? true : false,
                    "department_id" => $emp["dept"],
                    "designation_id" => $desigMap[$emp["designation"]]->id,
                    "phone" => $emp["mobile"],
                    "alternate_mobile" => $emp["alt_mobile"],
                    "emergency_contact" => $emp["emergency"],
                    "joining_date" => $emp["joining_date"],
                    "blood_group" => $emp["blood_group"],
                    "working_hours" => $emp["working_hours"],
                    "work_schedule_id" => $scheduleId,
                    "is_demo" => true,
                    "onboarded_at" => isset($emp["unonboarded"]) ? null : now(),
                ]
            );

            foreach ($emp["roles"] as $role) {
                DB::table("role_assignments")->updateOrInsert(
                    ["user_id" => $user->id, "role" => $role],
                    ["created_at" => now(), "updated_at" => now()]
                );
            }
            
            if (in_array("hr", $emp["roles"])) {
                DB::table("department_hr")->updateOrInsert(
                    ["department_id" => $emp["dept"], "user_id" => $user->id]
                );
            }

            if ($isProd && in_array("super_admin", $emp["roles"]) && isset($this->command)) {
                $this->command->info("Seeded super_admin ({$emp['email']}) with password: {$password}");
            }
        }

        // 7. Global chat conversation (every user sees scope=global conversations)
        Conversation::firstOrCreate(
            ['scope' => 'global'],
            ['name' => 'Global Chat']
        );

        // 8. Settings
        $settings = [
            ['key' => 'password.min_length', 'value' => json_encode(8), 'category' => 'security'],
            ['key' => 'password.require_mixed', 'value' => json_encode(true), 'category' => 'security'],
            ['key' => 'password.require_number', 'value' => json_encode(false), 'category' => 'security'],
            ['key' => 'password.require_symbol', 'value' => json_encode(false), 'category' => 'security'],
            ['key' => 'session.access_token_ttl', 'value' => json_encode(15), 'category' => 'security'],
            ['key' => 'session.refresh_token_ttl', 'value' => json_encode(7), 'category' => 'security'],
            ['key' => 'force_password_change', 'value' => json_encode(false), 'category' => 'security'],
            ['key' => 'reminders.shift_offset', 'value' => json_encode(15), 'category' => 'reminders'],
            ['key' => 'reminders.missed_clock_in_offset', 'value' => json_encode(30), 'category' => 'reminders'],
            ['key' => 'reminders.holiday_offset', 'value' => json_encode(10), 'category' => 'reminders'],
            ['key' => 'reminders.open_shift_flag_time', 'value' => json_encode('20:00'), 'category' => 'reminders'],
        ];

        foreach ($settings as $setting) {
            DB::table('settings')->updateOrInsert(
                ['key' => $setting['key'], 'category' => $setting['category']],
                [
                    'value' => $setting['value'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        // 9. Holidays (Indian Public & Company Holidays for 2026/2027)
        $currentYear = date('Y');
        $holidays = [
            ['name' => 'Republic Day', 'date' => "$currentYear-01-26", 'recurring' => true, 'description' => 'National Holiday'],
            ['name' => 'Independence Day', 'date' => "$currentYear-08-15", 'recurring' => true, 'description' => 'National Holiday'],
            ['name' => 'Gandhi Jayanti', 'date' => "$currentYear-10-02", 'recurring' => true, 'description' => 'National Holiday'],
            ['name' => 'Christmas Day', 'date' => "$currentYear-12-25", 'recurring' => true, 'description' => 'Public Holiday'],
            // Approximate dates for dynamic holidays
            ['name' => 'Holi', 'date' => "$currentYear-03-24", 'recurring' => false, 'description' => 'Festival of Colors'],
            ['name' => 'Diwali', 'date' => "$currentYear-11-01", 'recurring' => false, 'description' => 'Festival of Lights'],
            ['name' => 'Company Anniversary', 'date' => "$currentYear-05-15", 'recurring' => true, 'description' => 'Games4Kings Foundation Day'],
        ];

        foreach ($holidays as $holiday) {
            DB::table('holidays')->updateOrInsert(
                ['name' => $holiday['name']],
                [
                    'date' => clone \Carbon\Carbon::parse($holiday['date']),
                    'recurring' => $holiday['recurring'],
                    'description' => $holiday['description'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

    }
}
