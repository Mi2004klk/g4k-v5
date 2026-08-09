<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AutoNumbering;
use App\Services\AuditLogger;

class AutoNumberingController extends Controller
{
    public function index()
    {
        $records = AutoNumbering::all();
        return response()->json($records);
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'prefix' => 'nullable|string|max:10',
            'format' => 'required|string|max:50',
            'start_number' => 'required|integer|min:1',
        ]);

        $record = AutoNumbering::findOrFail($id);
        $before = $record->toArray();

        // If start_number is bumped higher than current_number, we update current_number
        // so that the next generated number takes off from the new start_number
        if ($validated['start_number'] > $record->current_number) {
            $validated['current_number'] = $validated['start_number'] - 1;
        }

        $record->update($validated);

        AuditLogger::log($request, 'update', 'auto_numbering', $record->id, $before, $record->toArray());

        return response()->json($record);
    }
}
