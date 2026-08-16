<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DatabaseSchemaTest extends TestCase
{
    /**
     * Test P0 tables exist.
     */
    public function test_p0_tables_exist(): void
    {
        $tables = [
            'users',
            'departments',
            'attendance_days',
            'leave_requests',
            'projects',
            'tasks'
        ];

        foreach ($tables as $table) {
            $this->assertTrue(Schema::hasTable($table), "Table {$table} is missing.");
        }
    }

    /**
     * Test critical columns drift on users.
     */
    public function test_critical_user_columns_exist(): void
    {
        $columns = ['id', 'name', 'email', 'password', 'department_id', 'status', 'role'];

        foreach ($columns as $column) {
            $this->assertTrue(Schema::hasColumn('users', $column), "Column {$column} on users is missing.");
        }
    }
}
