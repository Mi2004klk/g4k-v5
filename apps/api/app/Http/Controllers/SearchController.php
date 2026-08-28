<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Project;
use App\Models\Task;

class SearchController extends Controller
{
    public function search(Request $request)
    {
        $query = $request->query('q', '');
        
        if (strlen($query) < 2) {
            return response()->json([
                'users' => [],
                'projects' => [],
                'tasks' => []
            ]);
        }

        $users = User::where('name', 'like', "%{$query}%")
                     ->orWhere('email', 'like', "%{$query}%")
                     ->select('id', 'name', 'email', 'avatar')
                     ->limit(5)
                     ->get();
                     
        $projects = Project::where('name', 'like', "%{$query}%")
                           ->select('id', 'name', 'status')
                           ->limit(5)
                           ->get();
                           
        $tasks = Task::where('title', 'like', "%{$query}%")
                     ->select('id', 'title', 'status', 'priority')
                     ->limit(5)
                     ->get();

        return response()->json([
            'users' => $users,
            'projects' => $projects,
            'tasks' => $tasks
        ]);
    }
}
