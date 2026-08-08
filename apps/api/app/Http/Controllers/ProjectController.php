<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProjectController extends Controller
{
    public function index()
    {
        $projects = DB::table('projects')->orderBy('created_at', 'desc')->get();
        return response()->json(['data' => $projects]);
    }

    public function show($id)
    {
        $project = DB::table('projects')->where('id', $id)->first();
        if (!$project) return response()->json(['error' => 'Not found'], 404);

        $tasks = DB::table('tasks')
            ->leftJoin('users', 'users.id', '=', 'tasks.assignee_id')
            ->where('tasks.project_id', $id)
            ->select('tasks.*', 'users.name as assignee_name', 'users.email as assignee_email')
            ->get();

        $project->tasks = $tasks;
        return response()->json(['data' => $project]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'in:active,completed,archived'
        ]);

        $id = DB::table('projects')->insertGetId(array_merge($validated, [
            'created_at' => now(),
            'updated_at' => now()
        ]));

        return response()->json(['data' => DB::table('projects')->where('id', $id)->first()], 201);
    }
}
