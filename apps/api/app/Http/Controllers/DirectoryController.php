<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;

class DirectoryController extends Controller
{
    public function index(Request $request)
    {
        // Basic filter/search could be added here
        $query = User::with(['department', 'designation'])
            ->where('status', 'active');

        if ($request->has('search')) {
            $search = $request->query('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('employee_id', 'like', "%{$search}%");
            });
        }

        if ($request->has('department_id')) {
            $query->where('department_id', $request->query('department_id'));
        }

        return response()->json($query->paginate(20));
    }
}
