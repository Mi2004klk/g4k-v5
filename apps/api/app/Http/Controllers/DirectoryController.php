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
                  ->orWhere('employee_id', 'like', "%{$search}%");
            });
        }

        if ($request->has('department_id')) {
            $query->where('department_id', $request->query('department_id'));
        }

        if ($request->has('designation_id')) {
            $query->where('designation_id', $request->query('designation_id'));
        }

        $users = $query->orderBy('name', 'asc')->cursorPaginate(20);
        
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

    public function sendMessage(Request $request, $id)
    {
        $targetUser = User::findOrFail($id);
        $currentUser = $request->user();

        if ($currentUser->id === $targetUser->id) {
            return response()->json(['message' => 'Cannot message yourself'], 422);
        }

        $conversation = DB::transaction(function () use ($currentUser, $targetUser) {
            // Find existing direct conversation
            $existingConvId = DB::table('conversation_user')
                ->select('conversation_id')
                ->whereIn('user_id', [$currentUser->id, $targetUser->id])
                ->groupBy('conversation_id')
                ->havingRaw('COUNT(DISTINCT user_id) = 2')
                ->whereIn('conversation_id', function ($query) {
                    $query->select('id')->from('conversations')->where('scope', 'direct');
                })
                ->first();

            if ($existingConvId) {
                return $existingConvId->conversation_id;
            }

            // Create new conversation
            $convId = DB::table('conversations')->insertGetId([
                'scope' => 'direct',
                'name' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('conversation_user')->insert([
                [
                    'conversation_id' => $convId,
                    'user_id' => $currentUser->id,
                    'last_read_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'conversation_id' => $convId,
                    'user_id' => $targetUser->id,
                    'last_read_at' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            ]);

            return $convId;
        });

        return response()->json([
            'message' => 'Direct conversation initialized',
            'conversation_id' => $conversation,
            'target_user' => $targetUser->only(['id', 'name', 'email', 'avatar_url']),
        ]);
    }
}
