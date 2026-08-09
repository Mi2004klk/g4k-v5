<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Holiday;
use Illuminate\Support\Facades\Cache;

class HolidayController extends Controller
{
    public function index(Request $request)
    {
        $year = $request->query('year', date('Y'));
        
        $holidays = Cache::remember("holidays_{$year}", 3600, function () use ($year) {
            return Holiday::whereYear('date', $year)
                ->orderBy('date', 'asc')
                ->get();
        });

        return response()->json($holidays);
    }
}
