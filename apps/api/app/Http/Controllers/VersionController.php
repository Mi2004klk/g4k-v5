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
        $output = new BufferedOutput();
        Artisan::call('migrate:status', [], $output);
        $status = $output->fetch();
        
        $pending = str_contains($status, 'Pending');

        return response()->json([
            'commit' => config('app.commit_sha', 'unknown'),
            'pending_migrations' => $pending,
            'status' => $status
        ]);
    }
}
