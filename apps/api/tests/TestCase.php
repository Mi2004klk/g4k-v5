<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        try {
            \Illuminate\Support\Facades\DB::table('role_capabilities')->delete();
            \Illuminate\Support\Facades\DB::table('capabilities')->delete();
        } catch (\Exception $e) {}
        // The above ensures that any capabilities added by migrations are cleared,
        // so that CapabilityMatrix falls back to static::$defaultMatrix
        \App\Services\CapabilityMatrix::clearCache();
    }

    /**
     * Assert that the executed SQL queries during a callback are strictly less than or equal to a given limit.
     */
    protected function assertQueryCountLessThan(int $maxQueries, callable $callback): void
    {
        $count = 0;
        \Illuminate\Support\Facades\DB::listen(function () use (&$count) {
            $count++;
        });

        $callback();

        $this->assertLessThanOrEqual(
            $maxQueries,
            $count,
            "Exceeded maximum allowed database query limit of {$maxQueries}. Actual queries executed: {$count}."
        );
    }
}

