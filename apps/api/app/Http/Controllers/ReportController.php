<?php

namespace App\Http\Controllers;

use App\Models\ExportJob;
use App\Models\Task;
use App\Models\Project;
use App\Models\User;
use App\Jobs\GenerateReportJob;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function data(Request $request)
    {
        $key = $request->query('key', 'tasks');

        switch ($key) {
            case 'tasks':
                $data = Task::with(['project', 'assignee'])->latest()->paginate(25);
                break;
            case 'projects':
                $data = Project::with('owner')->latest()->paginate(25);
                break;
            case 'users':
            case 'productivity':
            default:
                $data = User::latest()->paginate(25);
                break;
        }

        return response()->json($data);
    }

    public function export(Request $request)
    {
        $validated = $request->validate([
            'key' => 'required|string',
            'format' => 'required|in:xlsx,csv,pdf',
            'filters' => 'nullable|array',
        ]);

        $exportJob = ExportJob::create([
            'user_id' => $request->user()->id,
            'report_key' => $validated['key'],
            'format' => $validated['format'],
            'filters' => $validated['filters'] ?? [],
            'status' => 'pending',
        ]);

        // Process job synchronously or queue depending on config
        GenerateReportJob::dispatch($exportJob);

        return response()->json($exportJob, 202);
    }

    public function exports(Request $request)
    {
        $exports = ExportJob::where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json($exports);
    }
}
