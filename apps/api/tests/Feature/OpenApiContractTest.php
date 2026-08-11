<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;

class OpenApiContractTest extends TestCase
{
    use RefreshDatabase;

    public function test_all_openapi_paths_exist_in_route_list(): void
    {
        $openapiPath = base_path('openapi/openapi.yaml');
        $this->assertFileExists($openapiPath);

        $yamlContent = file_get_contents($openapiPath);
        
        // Extract documented paths from OpenAPI YAML
        preg_match_all('/^\s\s(\/[a-zA-Z0-9_\-\/{}\.]*):/m', $yamlContent, $matches);
        $documentedPaths = array_unique($matches[1] ?? []);

        $this->assertNotEmpty($documentedPaths, 'OpenAPI specification should define paths.');

        // Get registered application routes
        $registeredRoutes = array_map(function ($route) {
            $uri = '/' . ltrim($route->uri(), '/');
            if (str_starts_with($uri, '/api/')) {
                $uri = substr($uri, 4); // Strip /api prefix for matching with openapi paths
            }
            return $uri;
        }, Route::getRoutes()->getRoutes());

        foreach ($documentedPaths as $path) {
            $pattern = preg_replace('/\{[a-zA-Z0-9_]+\}/', '{param}', $path);
            
            $matched = false;
            foreach ($registeredRoutes as $route) {
                $normalizedRoute = preg_replace('/\{[a-zA-Z0-9_]+\}/', '{param}', $route);
                if ($normalizedRoute === $pattern) {
                    $matched = true;
                    break;
                }
            }

            $this->assertTrue($matched, "Documented path '{$path}' should match a registered Laravel route.");
        }
    }
}
