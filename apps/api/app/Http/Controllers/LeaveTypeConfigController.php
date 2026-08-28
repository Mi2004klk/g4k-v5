<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\LeaveTypeConfig;

class LeaveTypeConfigController extends Controller
{
    public function index(Request $request)
    {
        $configs = LeaveTypeConfig::orderBy('sort_order')->get();
        return response()->json($configs);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'key' => 'required|string|unique:leave_type_configs,key|max:50',
            'label' => 'required|string|max:100',
            'default_allowed' => 'required|numeric|min:0|max:365',
            'is_active' => 'boolean',
        ]);

        $maxSort = LeaveTypeConfig::max('sort_order') ?? 0;
        $validated['sort_order'] = $maxSort + 1;
        $validated['is_active'] = $validated['is_active'] ?? true;

        $config = LeaveTypeConfig::create($validated);
        return response()->json($config, 201);
    }

    public function update(Request $request, $id)
    {
        $config = LeaveTypeConfig::findOrFail($id);

        $validated = $request->validate([
            'label' => 'sometimes|required|string|max:100',
            'default_allowed' => 'sometimes|required|numeric|min:0|max:365',
            'is_active' => 'sometimes|boolean',
        ]);

        $config->update($validated);
        return response()->json($config);
    }

    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'orders' => 'required|array',
            'orders.*.id' => 'required|exists:leave_type_configs,id',
            'orders.*.sort_order' => 'required|integer',
        ]);

        foreach ($validated['orders'] as $order) {
            LeaveTypeConfig::where('id', $order['id'])->update(['sort_order' => $order['sort_order']]);
        }

        return response()->json(['message' => 'Reordered successfully']);
    }
}
