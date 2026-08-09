<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DirectoryController extends Controller
{
    public function __construct()
    {
        $this->middleware('capability:directory.view')->only(['index', 'show']);
        $this->middleware('capability:directory.send-message')->only(['sendMessage']);
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
        return response()->json($users);
    }
    
    public function show($id)
    {
        $user = User::with(['department', 'designation'])
            ->where('status', 'active')
            ->findOrFail($id);
            
        return response()->json($user);
    }

    public function sendMessage(Request $request, $id)
    {
        $targetUser = User::findOrFail($id);
        $currentUser = $request->user();

        // Stub conversation session creation for direct messaging (Phase 8 full chat integration)
        $conversationId = "conv_" . min($currentUser->id, $targetUser->id) . "_" . max($currentUser->id, $targetUser->id);

        return response()->json([
            'message' => 'Direct conversation initialized',
            'conversation_id' => $conversationId,
            'target_user' => $targetUser->only(['id', 'name', 'email', 'avatar_url']),
        ]);
    }
}
