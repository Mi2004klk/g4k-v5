<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthTest extends TestCase
{
    public function test_health_check_returns_200_ok(): void
    {
        $response = $this->getJson("/health");

        $response->assertStatus(200)
                 ->assertJson(["status" => "ok"]);
    }
}
