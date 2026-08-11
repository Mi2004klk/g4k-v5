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
            $baseHolidays = Holiday::whereYear('date', $year)->orderBy('date', 'asc')->get();
            $recurringHolidays = Holiday::where('recurring', true)->whereYear('date', '<', $year)->get();
            
            // Map recurring to current year
            $expanded = $recurringHolidays->map(function ($h) use ($year) {
                $newH = clone $h;
                $newH->date = \Carbon\Carbon::parse($h->date)->setYear($year)->toDateString();
                return $newH;
            });
            
            return $baseHolidays->concat($expanded)->sortBy('date')->values();
        });

        return response()->json($holidays);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'date' => 'required|date',
            'recurring' => 'boolean',
            'description' => 'nullable|string',
        ]);

        $holiday = Holiday::create($validated);
        $this->clearHolidayCache($holiday->date);

        return response()->json($holiday, 201);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string',
            'date' => 'sometimes|date',
            'recurring' => 'boolean',
            'description' => 'nullable|string',
        ]);

        $holiday = Holiday::findOrFail($id);
        $oldDate = $holiday->date;
        $holiday->update($validated);
        $this->clearHolidayCache($holiday->date);
        if ($oldDate !== $holiday->date) {
            $this->clearHolidayCache($oldDate);
        }

        return response()->json($holiday);
    }

    public function destroy($id)
    {
        $holiday = Holiday::findOrFail($id);
        $date = $holiday->date;
        $holiday->delete();
        $this->clearHolidayCache($date);

        return response()->json(['message' => 'Deleted successfully']);
    }

    private function clearHolidayCache($date = null): void
    {
        $year = $date ? date('Y', strtotime($date)) : date('Y');
        Cache::forget("holidays_{$year}");
        Cache::forget("holidays_" . ($year + 1));
        Cache::forget("holidays_" . ($year - 1));
    }
}
