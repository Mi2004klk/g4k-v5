<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SmokeTest extends TestCase
{
    use RefreshDatabase;

    public function setUp(): void
    {
        parent::setUp();
        // Seed the demo dataset to ensure we have the expected demo accounts
        $this->artisan('demo:seed', ['--fresh' => true]);
    }

    public function test_authenticated_smoke_and_gates()
    {
        $demoEmails = ['g4kkarthik@gmail.com', 'hr@games4king.in', 'praveen@games4king.in'];

        foreach ($demoEmails as $email) {
            $user = User::where('email', $email)->first();
            $this->assertNotNull($user, "Demo user $email should exist.");

            $response = $this->actingAs($user)->getJson('/api/dashboard/init');
            if ($response->status() !== 200) file_put_contents(__DIR__.'/smoke-error.txt', "init: " . $response->getContent());
            $response->assertStatus(200);

            $response = $this->actingAs($user)->getJson('/api/notifications');
            if ($response->status() !== 200) file_put_contents(__DIR__.'/smoke-error.txt', "notif: " . $response->getContent());
            $response->assertStatus(200);

            $response = $this->actingAs($user)->getJson('/api/directory');
            if ($response->status() !== 200) file_put_contents(__DIR__.'/smoke-error.txt', "dir: " . $response->getContent());
            $response->assertStatus(200);
        }
    }
}
