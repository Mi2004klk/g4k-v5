<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\DB;


class DirectoryController extends Controller
{

    private function applyVisibilityRules(User $user)
    {
        $prefs = $user->preferences ?? [];
        $visibility = $prefs['directory_visibility'] ?? $prefs['profile_visibility'] ?? 'internal';

        $data = [
            'id' => $user->id,
            'name' => $user->name,
            'employee_id' => $user->employee_id,
            'avatar_url' => $user->avatar_url,
            'department' => $user->department,
            'designation' => $user->designation,
        ];

        if ($visibility === 'private') {
            $data['email'] = null;
            $data['phone'] = null;
        } elseif ($visibility === 'public') {
            $data['email'] = $user->email;
            $data['phone'] = $user->phone ?? null;
        } else {
            // 'internal' (default) - accessible to authenticated colleagues
            $data['email'] = $user->email;
            $data['phone'] = $user->phone ?? null;
        }

        $data['alternate_mobile'] = null; // Always hidden
        $data['emergency_contact'] = null; // Always hidden
        $data['blood_group'] = null; // Always hidden

        return $data;
    }

    public function index(Request $request)
    {
        // Active users only, with eager loading for minimal queries
        $query = User::with(['department', 'designation'])
            ->where('status', 'active');

        if ($request->has('search')) {
            $search = $request->query('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%")
                  ->orWhere('employee_id', 'like', "%{$search}%")
                  ->orWhereHas('department', function ($q2) use ($search) {
                      $q2->where('name', 'like', "%{$search}%");
                  })
                  ->orWhereHas('designation', function ($q3) use ($search) {
                      $q3->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->has('department_id')) {
            $query->where('department_id', $request->query('department_id'));
        }

        if ($request->has('designation_id')) {
            $query->where('designation_id', $request->query('designation_id'));
        }

        $users = $query->orderBy('name', 'asc')->paginate(24);
        
        $users->getCollection()->transform(function ($user) {
            return $this->applyVisibilityRules($user);
        });

        return response()->json($users);
    }
    
    public function show($id)
    {
        $user = User::with(['department', 'designation'])
            ->where('status', 'active')
            ->findOrFail($id);
            
        return response()->json($this->applyVisibilityRules($user));
    }
}
