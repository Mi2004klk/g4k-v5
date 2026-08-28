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
        return response()->json([
            'commit' => config('app.commit_sha', 'unknown')
        ]);
    }
}
