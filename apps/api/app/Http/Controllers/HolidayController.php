<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Holiday;
use Illuminate\Support\Facades\Cache;
use App\Http\Requests\StoreHolidayRequest;

class HolidayController extends Controller
{
    public function index(Request $request)
    {
        $year = (int)$request->query('year', date('Y'));
        
        $holidays = Cache::remember("holidays_{$year}", 3600, function () use ($year) {
            $baseHolidays = Holiday::whereYear('date', $year)->orderBy('date', 'asc')->get();
            $recurringHolidays = Holiday::where('recurring', true)->whereYear('date', '<', $year)->get();
            
            $expanded = $recurringHolidays->map(function ($h) use ($year) {
                $dt = \Carbon\Carbon::parse($h->date);
                if ($dt->month === 2 && $dt->day === 29 && !\Carbon\Carbon::create($year)->isLeapYear()) {
                    $dateStr = sprintf('%04d-02-28', $year);
                } else {
                    $dateStr = $dt->copy()->setYear((int)$year)->toDateString();
                }
                return [
                    'id' => $h->id,
                    'name' => $h->name,
                    'date' => $dateStr,
                    'recurring' => (bool)$h->recurring,
                    'description' => $h->description,
                    'created_at' => $h->created_at ? (string)$h->created_at : null,
                    'updated_at' => $h->updated_at ? (string)$h->updated_at : null,
                ];
            });

            $baseArray = $baseHolidays->map(fn($h) => [
                'id' => $h->id,
                'name' => $h->name,
                'date' => is_string($h->date) ? $h->date : \Carbon\Carbon::parse($h->date)->toDateString(),
                'recurring' => (bool)$h->recurring,
                'description' => $h->description,
                'created_at' => $h->created_at ? (string)$h->created_at : null,
                'updated_at' => $h->updated_at ? (string)$h->updated_at : null,
            ]);

            return $baseArray->concat($expanded)->sortBy('date')->values()->all();
        });

        return response()->json($holidays);
    }

    public function store(StoreHolidayRequest $request)
    {
        $validated = $request->validated();

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
