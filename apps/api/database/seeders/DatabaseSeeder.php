<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Department;
use App\Models\Team;
use App\Models\Designation;
use App\Models\AutoNumbering;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Designations (15 seed)
        $designationNames = [
            'Chief Executive Officer (CEO)',
            'Chief Technology Officer (CTO)',
            'Human Resources Manager',
            'Engineering Manager',
            'Product Manager',
            'Senior Software Engineer',
            'Software Engineer',
            'QA Engineer',
            'DevOps Engineer',
            'UI/UX Designer',
            'Marketing Manager',
            'Sales Representative',
            'Customer Support Agent',
            'Accountant',
            'System Administrator'
        ];

        $designations = [];
        foreach ($designationNames as $name) {
            $designations[$name] = Designation::firstOrCreate(['name' => $name]);
        }

        // 2. Departments & Teams
        $engDept = Department::firstOrCreate(['name' => 'Engineering'], ['description' => 'Product development and engineering']);
        $hrDept = Department::firstOrCreate(['name' => 'Human Resources'], ['description' => 'HR and Operations']);

        $frontendTeam = Team::firstOrCreate(['department_id' => $engDept->id, 'name' => 'Frontend'], ['description' => 'UI and Web development']);
        $backendTeam = Team::firstOrCreate(['department_id' => $engDept->id, 'name' => 'Backend'], ['description' => 'API and Database']);

        // Initialize AutoNumbering for users
        AutoNumbering::generateNext('user'); // Just to initialize it if not

        // 3. Users
        $users = [
            ['name' => 'Karthik', 'email' => 'karthik@games4king.com', 'role' => 'super_admin', 'designation' => 'Chief Executive Officer (CEO)', 'dept' => null, 'team' => null],
            ['name' => 'Aravind', 'email' => 'aravind@games4king.com', 'role' => 'hr', 'designation' => 'Human Resources Manager', 'dept' => $hrDept->id, 'team' => null],
            ['name' => 'Praveen', 'email' => 'praveen@games4king.com', 'role' => 'employee', 'designation' => 'Senior Software Engineer', 'dept' => $engDept->id, 'team' => $backendTeam->id],
            ['name' => 'Admin1', 'email' => 'admin1@games4king.com', 'role' => 'super_admin', 'designation' => 'System Administrator', 'dept' => null, 'team' => null],
            ['name' => 'HR1', 'email' => 'hr1@games4king.com', 'role' => 'hr', 'designation' => 'Human Resources Manager', 'dept' => $hrDept->id, 'team' => null],
            ['name' => 'Emp1', 'email' => 'emp1@games4king.com', 'role' => 'employee', 'designation' => 'Software Engineer', 'dept' => $engDept->id, 'team' => $frontendTeam->id],
            ['name' => 'Emp2', 'email' => 'emp2@games4king.com', 'role' => 'employee', 'designation' => 'QA Engineer', 'dept' => $engDept->id, 'team' => null],
            ['name' => 'Manager1', 'email' => 'manager1@games4king.com', 'role' => 'employee', 'designation' => 'Engineering Manager', 'dept' => $engDept->id, 'team' => null],
            ['name' => 'Security1', 'email' => 'security1@games4king.com', 'role' => 'employee', 'designation' => 'System Administrator', 'dept' => $engDept->id, 'team' => $backendTeam->id],
            ['name' => 'Accounts1', 'email' => 'accounts1@games4king.com', 'role' => 'employee', 'designation' => 'Accountant', 'dept' => null, 'team' => null],
            ['name' => 'Emp3', 'email' => 'emp3@games4king.com', 'role' => 'employee', 'designation' => 'Software Engineer', 'dept' => $engDept->id, 'team' => $backendTeam->id],
            ['name' => 'Emp4', 'email' => 'emp4@games4king.com', 'role' => 'employee', 'designation' => 'UI/UX Designer', 'dept' => $engDept->id, 'team' => $frontendTeam->id],
            ['name' => 'Emp5', 'email' => 'emp5@games4king.com', 'role' => 'employee', 'designation' => 'Software Engineer', 'dept' => $engDept->id, 'team' => $frontendTeam->id],
        ];

        foreach ($users as $u) {
            $user = User::firstOrCreate(
                ['email' => $u['email']],
                [
                    'name' => $u['name'],
                    'password' => Hash::make('password'),
                    'must_change_password' => true,
                    'designation_id' => $designations[$u['designation']]->id,
                    'department_id' => $u['dept'],
                    'team_id' => $u['team'],
                ]
            );

            \DB::table('role_assignments')->updateOrInsert(
                ['user_id' => $user->id, 'role' => $u['role']],
                ['created_at' => now(), 'updated_at' => now()]
            );
        }

        // 4. Settings
        foreach ([
            ['key' => 'company_name', 'value' => 'Games4Kings', 'type' => 'string'],
            ['key' => 'work_start_time', 'value' => '09:00', 'type' => 'string'],
            ['key' => 'work_end_time', 'value' => '18:00', 'type' => 'string'],
        ] as $setting) {
            \DB::table('settings')->updateOrInsert(['key' => $setting['key']], $setting);
        }

        // 5. Attendance (Last 7 days for Praveen)
        $praveen = User::where('email', 'praveen@games4king.com')->first();
        if ($praveen) {
            for ($i = 1; $i <= 7; $i++) {
                \DB::table('attendance_records')->updateOrInsert(
                    ['user_id' => $praveen->id, 'date' => now()->subDays($i)->toDateString()],
                    [
                        'total_worked_minutes' => 480, // 8 hours
                        'status' => 'present',
                    ]
                );
            }
        }

        // 6. Projects & Tasks
        $projectId = \DB::table('projects')->where('name', 'G4K Workplace OS')->value('id');
        if (!$projectId) {
            $projectId = \DB::table('projects')->insertGetId([
                'name' => 'G4K Workplace OS',
                'description' => 'The ultimate HR & Ops platform.',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        \DB::table('tasks')->updateOrInsert(
            ['project_id' => $projectId, 'title' => 'Finalize M1 Polish'],
            [
                'assignee_id' => $praveen ? $praveen->id : null,
                'description' => 'Ensure seed data and PWA are working.',
                'status' => 'in_progress',
                'estimated_hours' => 5,
                'logged_hours' => 2,
                'created_at' => now(),
                'updated_at' => now()
            ]
        );
        \DB::table('tasks')->updateOrInsert(
            ['project_id' => $projectId, 'title' => 'Implement Auth'],
            [
                'assignee_id' => $praveen ? $praveen->id : null,
                'description' => 'Sanctum auth.',
                'status' => 'done',
                'estimated_hours' => 8,
                'logged_hours' => 8,
                'created_at' => now(),
                'updated_at' => now()
            ]
        );

        // 7. Global Chat
        $convId = \DB::table('conversations')->where('name', 'General')->value('id');
        if (!$convId) {
            $convId = \DB::table('conversations')->insertGetId([
                'name' => 'General',
                'type' => 'global',
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        if ($praveen) {
            \DB::table('conversation_user')->updateOrInsert(['conversation_id' => $convId, 'user_id' => $praveen->id]);
            \DB::table('messages')->updateOrInsert(
                ['conversation_id' => $convId, 'sender_id' => $praveen->id, 'body' => 'Welcome to the new G4K Workplace OS!'],
                ['created_at' => now(), 'updated_at' => now()]
            );
        }
    }
}
