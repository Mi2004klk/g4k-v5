<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ScheduledReport;

class ScheduledReportController extends Controller
{
    public function index(Request $request)
    {
        $reports = ScheduledReport::orderBy('created_at', 'desc')->get();
        return response()->json($reports);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'type' => 'required|string|max:50',
            'frequency' => 'required|in:daily,weekly,monthly',
            'time' => 'required|string',
            'day_of_week' => 'nullable|integer|between:0,6',
            'day_of_month' => 'nullable|integer|between:1,31',
            'recipients' => 'required|array',
            'recipients.*' => 'email',
            'is_active' => 'boolean',
        ]);

        $validated['is_active'] = $validated['is_active'] ?? true;
        
        $report = ScheduledReport::create($validated);
        return response()->json($report, 201);
    }

    public function update(Request $request, $id)
    {
        $report = ScheduledReport::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:150',
            'type' => 'sometimes|required|string|max:50',
            'frequency' => 'sometimes|required|in:daily,weekly,monthly',
            'time' => 'sometimes|required|string',
            'day_of_week' => 'nullable|integer|between:0,6',
            'day_of_month' => 'nullable|integer|between:1,31',
            'recipients' => 'sometimes|required|array',
            'recipients.*' => 'email',
            'is_active' => 'sometimes|boolean',
        ]);

        $report->update($validated);
        return response()->json($report);
    }

    public function destroy($id)
    {
        $report = ScheduledReport::findOrFail($id);
        $report->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
