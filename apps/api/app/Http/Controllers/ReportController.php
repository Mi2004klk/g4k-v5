<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function data(Request $request, $type)
    {
        $startDate = $request->query('start_date', now()->subDays(30)->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());

        if ($type === 'attendance') {
            $data = DB::table('attendance_records')
                ->join('users', 'users.id', '=', 'attendance_records.user_id')
                ->whereBetween('date', [$startDate, $endDate])
                ->select('users.name', 'attendance_records.date', 'attendance_records.status', 'attendance_records.check_in', 'attendance_records.check_out')
                ->orderBy('date', 'desc')
                ->get();
            return response()->json(['data' => $data]);
        }

        if ($type === 'productivity') {
            $data = DB::table('tasks')
                ->join('users', 'users.id', '=', 'tasks.assignee_id')
                ->whereBetween('tasks.updated_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                ->select('users.name', 'tasks.title', 'tasks.status', 'tasks.logged_hours')
                ->orderBy('tasks.updated_at', 'desc')
                ->get();
            return response()->json(['data' => $data]);
        }

        return response()->json(['error' => 'Invalid report type'], 400);
    }

    public function exportCsv(Request $request, $type)
    {
        $startDate = $request->query('start_date', now()->subDays(30)->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$type}_report_{$startDate}_{$endDate}.csv\"",
        ];

        return new StreamedResponse(function () use ($type, $startDate, $endDate) {
            $handle = fopen('php://output', 'w');

            if ($type === 'attendance') {
                fputcsv($handle, ['Employee', 'Date', 'Status', 'Check In', 'Check Out']);
                $records = DB::table('attendance_records')
                    ->join('users', 'users.id', '=', 'attendance_records.user_id')
                    ->whereBetween('date', [$startDate, $endDate])
                    ->orderBy('date', 'desc')
                    ->get();
                foreach ($records as $row) {
                    fputcsv($handle, [$row->name, $row->date, $row->status, $row->check_in, $row->check_out]);
                }
            } elseif ($type === 'productivity') {
                fputcsv($handle, ['Employee', 'Task', 'Status', 'Logged Hours']);
                $records = DB::table('tasks')
                    ->join('users', 'users.id', '=', 'tasks.assignee_id')
                    ->whereBetween('tasks.updated_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                    ->orderBy('tasks.updated_at', 'desc')
                    ->get();
                foreach ($records as $row) {
                    fputcsv($handle, [$row->name, $row->title, $row->status, $row->logged_hours]);
                }
            }

            fclose($handle);
        }, 200, $headers);
    }
}
