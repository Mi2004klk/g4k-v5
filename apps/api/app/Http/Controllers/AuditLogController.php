<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\ExportJob;
use App\Jobs\ExportAuditLogsJob;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::with('user')->latest('at');

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->query('user_id'));
        }
        if ($request->filled('action')) {
            $query->where('action', $request->query('action'));
        }
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('at', [$request->query('start_date'), $request->query('end_date')]);
        }

        // Use cursor pagination for large datasets
        $request->validate(['per_page' => 'nullable|integer|in:20,50,100,1000']);
        $perPage = $request->input('per_page', 50);
        $logs = $query->paginate($perPage);
        
        return response()->json($logs);
    }

    public function export(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'action' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'format' => 'nullable|in:csv,xlsx'
        ]);

        $filters = [
            'user_id' => $validated['user_id'] ?? null,
            'action' => $validated['action'] ?? null,
            'start_date' => $validated['start_date'] ?? null,
            'end_date' => $validated['end_date'] ?? null,
        ];

        $exportJob = ExportJob::create([
            'user_id' => $request->user()->id,
            'report_key' => 'audit_logs',
            'format' => $validated['format'] ?? 'xlsx',
            'status' => 'pending',
            'filters' => $filters,
        ]);

        ExportAuditLogsJob::dispatch($exportJob, $filters);

        return response()->json($exportJob, 202);
    }
}
