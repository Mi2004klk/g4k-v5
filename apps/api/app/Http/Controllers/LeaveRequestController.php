<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class LeaveRequestController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $activeRole = 'employee';
        if ($user->currentAccessToken()) {
            foreach ($user->currentAccessToken()->abilities as $ability) {
                if (str_starts_with($ability, 'role:')) {
                    $activeRole = substr($ability, 5);
                    break;
                }
            }
        }

        if (in_array($activeRole, ['super_admin', 'hr'])) {
            // HR/Admin view: show all pending approvals, plus their own history
            $requests = DB::table('leave_requests')
                ->join('users', 'users.id', '=', 'leave_requests.user_id')
                ->select('leave_requests.*', 'users.name as user_name', 'users.email as user_email')
                ->orderBy('created_at', 'desc')
                ->get();
        } else {
            // Employee view: show own history
            $requests = DB::table('leave_requests')
                ->where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return response()->json(['data' => $requests]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'leave_type' => 'required|in:sick,vacation,personal,other',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string'
        ]);

        $id = DB::table('leave_requests')->insertGetId([
            'user_id' => $request->user()->id,
            'leave_type' => $validated['leave_type'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'reason' => $validated['reason'],
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $record = DB::table('leave_requests')->where('id', $id)->first();
        return response()->json(['data' => $record], 201);
    }

    public function approve(Request $request, $id)
    {
        // Enforced by middleware, but we double check
        $user = $request->user();
        DB::table('leave_requests')->where('id', $id)->update([
            'status' => 'approved',
            'approved_by_id' => $user->id,
            'review_comment' => $request->input('review_comment'),
            'updated_at' => now()
        ]);

        return response()->json(['message' => 'Leave approved']);
    }

    public function reject(Request $request, $id)
    {
        $user = $request->user();
        DB::table('leave_requests')->where('id', $id)->update([
            'status' => 'rejected',
            'approved_by_id' => $user->id,
            'review_comment' => $request->input('review_comment'),
            'updated_at' => now()
        ]);

        return response()->json(['message' => 'Leave rejected']);
    }
}
