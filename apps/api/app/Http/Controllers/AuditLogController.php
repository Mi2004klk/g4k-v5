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
        $logs = $query->cursorPaginate(50);
        
        return response()->json($logs);
    }

    public function export(Request $request)
    {
        $exportJob = ExportJob::create([
            'user_id' => $request->user()->id,
            'report_key' => 'audit_logs',
            'format' => 'csv',
            'status' => 'pending',
            'parameters' => $request->all(),
        ]);

        ExportAuditLogsJob::dispatch($exportJob, $request->all());

        return response()->json($exportJob, 202);
    }
}
