<?php

namespace App\Http\Controllers;

use App\Models\SavedView;
use Illuminate\Http\Request;

class SavedViewController extends Controller
{
    public function index(Request $request)
    {
        $entity = $request->query('entity', 'tasks');
        $views = SavedView::where('user_id', $request->user()->id)
            ->where('entity', $entity)
            ->limit(100)
            ->get();
        return response()->json($views);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'entity' => 'required|in:tasks,projects',
            'name' => 'required|string|max:255',
            'config' => 'required|array',
        ]);

        $view = SavedView::create([
            'user_id' => $request->user()->id,
            'entity' => $validated['entity'],
            'name' => $validated['name'],
            'config' => $validated['config'],
        ]);

        return response()->json($view);
    }

    public function destroy(Request $request, $id)
    {
        $view = SavedView::where('user_id', $request->user()->id)->findOrFail($id);
        $view->delete();
        return response()->json(['message' => 'Saved view deleted']);
    }
}
