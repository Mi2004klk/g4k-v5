<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Console\Output\BufferedOutput;

class VersionController extends Controller
{
    public function index()
    {
        $status = \Illuminate\Support\Facades\Cache::remember('migration_status_cmd', 3600, function () {
            $output = new BufferedOutput();
            Artisan::call('migrate:status', [], $output);
            return $output->fetch();
        });
        
        $pending = str_contains($status, 'Pending');

        return response()->json([
            'commit' => config('app.commit_sha', 'unknown'),
            'pending_migrations' => $pending,
            'status' => $status
        ]);
    }
}
