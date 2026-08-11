<?php

namespace Tests\Feature\Performance;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class QueryCountTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        \Illuminate\Support\Facades\Cache::flush();

        $this->withoutMiddleware([
            \App\Http\Middleware\RequireCapability::class,
            \App\Http\Middleware\ForceOnboarding::class,
            \App\Http\Middleware\ForcePasswordChange::class,
        ]);

        $this->user = User::factory()->create([
            'onboarded_at' => now(),
            'must_change_password' => false,
        ]);
    }

    private function assertMaxQueries(string $endpoint, int $maxQueries = 5): void
    {
        DB::flushQueryLog();
        DB::enableQueryLog();

        $response = $this->actingAs($this->user)->getJson($endpoint);

        $queryCount = count(DB::getQueryLog());
        DB::disableQueryLog();

        $this->assertTrue(
            $queryCount <= $maxQueries,
            "Endpoint {$endpoint} executed {$queryCount} queries, exceeding maximum allowed of {$maxQueries}."
        );
    }

    public function test_dashboard_metrics_query_count(): void
    {
        $this->assertMaxQueries('/api/dashboard/metrics', 5);
    }

    public function test_attendance_me_history_query_count(): void
    {
        $this->assertMaxQueries('/api/attendance/me/history', 5);
    }

    public function test_attendance_admin_overview_query_count(): void
    {
        $this->assertMaxQueries('/api/attendance/admin/overview', 5);
    }

    public function test_attendance_hr_today_query_count(): void
    {
        $this->assertMaxQueries('/api/attendance/hr/today', 5);
    }

    public function test_leave_requests_query_count(): void
    {
        $this->assertMaxQueries('/api/leave-requests', 5);
    }

    public function test_audit_logs_query_count(): void
    {
        $this->assertMaxQueries('/api/audit-logs', 5);
    }

    public function test_reports_attendance_summary_query_count(): void
    {
        $this->assertMaxQueries('/api/reports/attendance-summary', 5);
    }
}
