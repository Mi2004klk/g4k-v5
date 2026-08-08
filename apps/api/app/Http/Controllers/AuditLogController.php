<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $logs = DB::table('audit_logs')
            ->leftJoin('users', 'users.id', '=', 'audit_logs.user_id')
            ->select('audit_logs.*', 'users.name as user_name', 'users.email as user_email')
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();
            
        return response()->json(['data' => $logs]);
    }

    public function exportCsv(Request $request)
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"audit_logs_export.csv\"",
        ];

        return new StreamedResponse(function () {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['ID', 'User', 'Action', 'Resource', 'Metadata', 'IP Address', 'Date']);
            
            $logs = DB::table('audit_logs')
                ->leftJoin('users', 'users.id', '=', 'audit_logs.user_id')
                ->select('audit_logs.*', 'users.name as user_name')
                ->orderBy('created_at', 'desc')
                ->get();
                
            foreach ($logs as $row) {
                fputcsv($handle, [
                    $row->id,
                    $row->user_name ?? 'System',
                    $row->action_type,
                    $row->resource_name,
                    $row->metadata,
                    $row->ip_address,
                    $row->created_at
                ]);
            }
            fclose($handle);
        }, 200, $headers);
    }
}
