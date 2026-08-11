<?php

namespace App\Http\Controllers;

use App\Models\SavedView;
use Illuminate\Http\Request;

class SavedViewController extends Controller
{
    public function index(Request $request)
    {
        $module = $request->query('module', 'tasks');
        $views = SavedView::where('user_id', $request->user()->id)
            ->where('entity', $module)
            ->limit(100)
            ->get()
            ->map(function ($view) {
                return [
                    'id' => $view->id,
                    'name' => $view->name,
                    'module' => $view->entity,
                    'filters' => $view->config,
                ];
            });
        return response()->json($views);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'module' => 'required|in:tasks,projects,attendance',
            'name' => 'required|string|max:255',
            'filters' => 'required|array',
        ]);

        $view = SavedView::create([
            'user_id' => $request->user()->id,
            'entity' => $validated['module'],
            'name' => $validated['name'],
            'config' => $validated['filters'],
        ]);

        return response()->json([
            'id' => $view->id,
            'name' => $view->name,
            'module' => $view->entity,
            'filters' => $view->config,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $view = SavedView::where('user_id', $request->user()->id)->findOrFail($id);
        $view->delete();
        return response()->json(['message' => 'Saved view deleted']);
    }
}
