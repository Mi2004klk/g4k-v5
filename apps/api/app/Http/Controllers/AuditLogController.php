<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
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

        $logs = $query->get();

        $csv = "ID,Action,User,Subject Type,Subject ID,Before,After,IP,Meta,Timestamp\n";
        foreach ($logs as $log) {
            $before = str_replace('"', '""', json_encode($log->before));
            $after = str_replace('"', '""', json_encode($log->after));
            $meta = str_replace('"', '""', json_encode($log->meta));
            $user = $log->user ? str_replace('"', '""', $log->user->name) : 'System';
            $csv .= "{$log->id},{$log->action},\"{$user}\",{$log->subject_type},{$log->subject_id},\"{$before}\",\"{$after}\",{$log->ip},\"{$meta}\",{$log->at}\n";
        }

        return response($csv)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="audit-logs.csv"');
    }
}
