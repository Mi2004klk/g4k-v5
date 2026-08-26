<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\RoleAssignment;
use Illuminate\Support\Facades\Route;
use Database\Seeders\DatabaseSeeder;

class RoleMatrixTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Ensure capabilities are seeded so roles have proper permissions
        $this->seed(DatabaseSeeder::class);
        $this->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class);
    }

    public function test_role_matrix_enforcement()
    {
        $admin = User::factory()->create(['active_role' => 'super_admin', 'onboarded_at' => now()]);
        $hr = User::factory()->create(['active_role' => 'hr', 'onboarded_at' => now()]);
        $employee = User::factory()->create(['active_role' => 'employee', 'onboarded_at' => now()]);

        // Give them actual roles in DB
        RoleAssignment::create(['user_id' => $admin->id, 'role' => 'super_admin']);
        RoleAssignment::create(['user_id' => $hr->id, 'role' => 'hr']);
        RoleAssignment::create(['user_id' => $employee->id, 'role' => 'employee']);

        // Get all API routes
        $routes = collect(Route::getRoutes())->filter(function ($route) {
            return str_starts_with($route->uri(), 'api/') && !str_contains($route->uri(), 'broadcasting');
        });

        // The capabilities matrix defines which role is expected to pass capability middleware
        // For endpoints governed by policies or simple checks (like profile), we assume allowed 
        // to at least reach the controller (so not 403 at the router level).

        foreach ($routes as $route) {
            $uri = $route->uri();
            // Substitute parameters with dummy IDs
            $uri = preg_replace('/\{[^\}]+\}/', '1', $uri);
            $method = $route->methods()[0];
            $middleware = $route->gatherMiddleware();

            $requiredCapabilities = [];
            foreach ($middleware as $m) {
                if (str_starts_with($m, 'capability:')) {
                    $caps = explode(':', $m)[1];
                    $requiredCapabilities = array_merge($requiredCapabilities, explode('|', $caps));
                }
            }

            // We test the endpoints by checking if they throw 403
            $this->checkEndpointAccess($admin, 'super_admin', $method, $uri, $requiredCapabilities);
            $this->checkEndpointAccess($hr, 'hr', $method, $uri, $requiredCapabilities);
            $this->checkEndpointAccess($employee, 'employee', $method, $uri, $requiredCapabilities);
        }
    }

    public function test_resolver_token_super_admin_overrides_db()
    {
        $user = User::factory()->create(['active_role' => 'employee', 'onboarded_at' => now()]);
        $tokenAdmin = $user->createToken('Test', ['role:super_admin'])->plainTextToken;
        $resAdmin = $this->withHeaders(['Authorization' => 'Bearer ' . $tokenAdmin])->get('/api/me/capabilities');
        $resAdmin->assertStatus(200);
        $this->assertContains('*', $resAdmin->json('capabilities')); 
    }

    public function test_resolver_token_hr_overrides_db()
    {
        $user = User::factory()->create(['active_role' => 'employee', 'onboarded_at' => now()]);
        $tokenHr = $user->createToken('Test', ['role:hr'])->plainTextToken;
        $resHr = $this->withHeaders(['Authorization' => 'Bearer ' . $tokenHr])->get('/api/me/capabilities');
        $resHr->assertStatus(200);
        $this->assertContains('users.employee.manage', $resHr->json('capabilities')); 
    }

    public function test_resolver_token_employee_overrides_db()
    {
        $user = User::factory()->create(['active_role' => 'super_admin', 'onboarded_at' => now()]);
        $tokenEmp = $user->createToken('Test', ['role:employee'])->plainTextToken;
        $resEmp = $this->withHeaders(['Authorization' => 'Bearer ' . $tokenEmp])->get('/api/me/capabilities');
        $resEmp->assertStatus(200);
        $this->assertNotContains('*', $resEmp->json('capabilities')); 
        $this->assertContains('profile.edit', $resEmp->json('capabilities')); 
    }

    public function test_second_device_cannot_change_first_session_role()
    {
        $user = User::factory()->create(['active_role' => 'super_admin', 'onboarded_at' => now()]);
        RoleAssignment::create(['user_id' => $user->id, 'role' => 'super_admin']);
        RoleAssignment::create(['user_id' => $user->id, 'role' => 'employee']);

        // Device A logs in as admin and gets an access token
        $tokenA = $user->createToken('Device A', ['role:super_admin'])->plainTextToken;

        // Device B logs in as employee, or uses /auth/role to switch role.
        // This updates the database column.
        $user->active_role = 'employee';
        $user->save();

        // Device A makes a request using its original token
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $tokenA,
        ])->get('/api/me/capabilities');

        $response->assertStatus(200);
        
        // Device A should STILL be resolved as super_admin because its token has role:super_admin
        // A super_admin will have '*' capability, while an employee will not.
        $this->assertContains('*', $response->json('capabilities'));
    }

    private function checkEndpointAccess(User $user, string $role, string $method, string $uri, array $requiredCapabilities)
    {
        \Laravel\Sanctum\Sanctum::actingAs($user, ['role:' . $role]);
        try {
            $response = $this->json($method, $uri);
            $statusCode = $response->getStatusCode();
            $content = $response->content();
        } catch (\Throwable $e) {
            // If the controller threw an exception (e.g. PDOException for duplicate insert), 
            // it means it got PAST the capability middleware.
            $statusCode = 500;
            $content = $e->getMessage();
        }

        // Does the user have AT LEAST ONE of the required capabilities?
        $isAuthorized = empty($requiredCapabilities);
        foreach ($requiredCapabilities as $cap) {
            if (\App\Services\CapabilityMatrix::hasCapability($role, $cap)) {
                $isAuthorized = true;
                break;
            }
        }

        if ($isAuthorized) {
            // If it returns 403, it must be a business logic 403 (e.g. not your department), 
            // NOT a capability middleware 403.
            if ($statusCode === 403) {
                $this->assertStringNotContainsString(
                    'Unauthorized action.',
                    $content,
                    "Role {$role} was denied by Capability middleware for {$method} /{$uri} despite having capability"
                );
            }
        } else {
            if ($statusCode === 404) {
                $this->fail("Unexpected 404 (ModelNotFound?) on {$method} /{$uri} for role {$role} instead of 403: " . $content);
            }
            if ($statusCode === 500) {
                $this->fail("Unexpected 500 on {$method} /{$uri} for role {$role} instead of 403: " . $content);
            }
            // Should be exactly 403 Forbidden from the capability middleware
            $this->assertEquals(403, $statusCode, "Expected 403 for unauthorized {$method} /{$uri}");
            $this->assertStringContainsString(
                'Unauthorized action.',
                $content,
                "Role {$role} SHOULD be denied by Capability middleware for {$method} /{$uri} but got something else"
            );
        }
    }
}
