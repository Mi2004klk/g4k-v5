<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Company;
use App\Models\AutoNumbering;
use Laravel\Sanctum\Sanctum;

class OrgManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        \Illuminate\Support\Facades\Cache::flush();
        // Seed the basic structure
        $this->artisan('db:seed');
    }

    public function test_super_admin_can_update_auto_numbering()
    {
        $admin = User::whereHas('roleAssignments', function ($query) {
            $query->where('role', 'super_admin');
        })->first();
        $admin->must_change_password = false;
        $admin->onboarded_at = now();
        $admin->save();

        $token = $admin->createToken('test', ['role:super_admin'])->plainTextToken;
        $this->withToken($token);
        $caps = \App\Services\CapabilityMatrix::getCapabilitiesForRole('super_admin');
        if (!in_array('*', $caps)) {
            dump("Caps missing! ", $caps);
        }

        // First, check it works
        $companyNumbering = AutoNumbering::where('entity_type', 'company')->first();

        $response = $this->putJson("/api/auto-numberings/{$companyNumbering->id}", [
            'prefix' => 'NEW-',
            'start_number' => 10,
            'format' => '{PREFIX}{000}',
        ]);

        $this->assertEquals(200, $response->status(), "Response: " . $response->content());
        $this->assertDatabaseHas('auto_numberings', [
            'id' => $companyNumbering->id,
            'prefix' => 'NEW-',
            'start_number' => 10,
            'format' => '{PREFIX}{000}'
        ]);
    }

    public function test_employee_cannot_update_auto_numbering()
    {
        $employee = User::whereHas('roleAssignments', function ($query) {
            $query->where('role', 'employee');
        })->first();
        $employee->must_change_password = false;
        $employee->onboarded_at = now();
        $employee->save();

        $token = $employee->createToken('test', ['role:employee'])->plainTextToken;
        $this->withToken($token);

        $companyNumbering = AutoNumbering::where('entity_type', 'company')->first();

        try {
            $response = $this->putJson("/api/auto-numberings/{$companyNumbering->id}", [
                'prefix' => 'FAIL-',
                'start_number' => 1,
                'format' => '{PREFIX}{000}',
            ]);
            $response->assertStatus(403);
        } catch (\Throwable $e) {
            dump($e->getMessage());
            dump($e->getTraceAsString());
            throw $e;
        }
    }
}
