<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TaskController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'title' => 'required|string',
            'description' => 'nullable|string',
            'assignee_id' => 'nullable|exists:users,id',
            'estimated_hours' => 'numeric|min:0'
        ]);

        $id = DB::table('tasks')->insertGetId(array_merge($validated, [
            'status' => 'todo',
            'created_at' => now(),
            'updated_at' => now()
        ]));

        // Basic notification logic stub
        if (!empty($validated['assignee_id'])) {
            // In a full implementation, insert into notifications table here
        }

        return response()->json(['data' => DB::table('tasks')->where('id', $id)->first()], 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:todo,in_progress,review,done'
        ]);

        DB::table('tasks')->where('id', $id)->update([
            'status' => $validated['status'],
            'updated_at' => now()
        ]);

        return response()->json(['message' => 'Status updated']);
    }

    public function logTime(Request $request, $id)
    {
        $validated = $request->validate([
            'hours' => 'required|numeric|min:0',
            'date' => 'required|date'
        ]);

        DB::transaction(function () use ($request, $id, $validated) {
            DB::table('task_time_logs')->insert([
                'task_id' => $id,
                'user_id' => $request->user()->id,
                'hours' => $validated['hours'],
                'date' => $validated['date'],
                'created_at' => now(),
                'updated_at' => now()
            ]);

            DB::table('tasks')->where('id', $id)->increment('logged_hours', $validated['hours']);
        });

        return response()->json(['message' => 'Time logged successfully']);
    }

    public function pending(Request $request)
    {
        $count = DB::table('tasks')
            ->where('assignee_id', $request->user()->id)
            ->whereIn('status', ['todo', 'in_progress', 'review'])
            ->count();
            
        return response()->json(['count' => $count]);
    }
}
