<?php

namespace App\Http\Controllers;

use App\Models\LoginAttempt;
use Illuminate\Http\Request;

class LoginAttemptController extends Controller
{
    public function index(Request $request)
    {
        $query = LoginAttempt::with('user')->latest();

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->query('user_id'));
        }
        if ($request->filled('identifier')) {
            $query->where('identifier', 'like', '%' . $request->query('identifier') . '%');
        }
        if ($request->filled('ip_address')) {
            $query->where('ip_address', 'like', '%' . $request->query('ip_address') . '%');
        }
        if ($request->filled('status')) {
            if ($request->query('status') === 'success') {
                $query->where('success', true);
            } elseif ($request->query('status') === 'failed') {
                $query->where('success', false);
            } elseif ($request->query('status') === 'suspicious') {
                $query->where('is_suspicious', true);
            }
        }
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('created_at', [
                $request->query('start_date'), 
                \Carbon\Carbon::parse($request->query('end_date'))->endOfDay()
            ]);
        }

        $request->validate(['per_page' => 'nullable|integer|in:20,50,100,1000']);
        $perPage = $request->input('per_page', 50);
        $attempts = $query->paginate($perPage);
        
        return response()->json($attempts);
    }
}
