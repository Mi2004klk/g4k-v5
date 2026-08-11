<?php

namespace App\Http\Controllers;

use App\Models\QaForm;
use App\Models\QaFormField;
use Illuminate\Http\Request;

class QaController extends Controller
    public function index()
    {
        return response()->json(QaForm::with('fields')->latest()->limit(100)->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'fields' => 'required|array|min:1',
            'fields.*.label' => 'required|string',
            'fields.*.field_type' => 'required|in:input,textarea,checkbox,slider,select',
            'fields.*.required' => 'boolean',
            'fields.*.options' => 'nullable|array',
        ]);

        $qaForm = QaForm::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'created_by' => $request->user()->id,
        ]);

        foreach ($validated['fields'] as $index => $field) {
            QaFormField::create([
                'qa_form_id' => $qaForm->id,
                'label' => $field['label'],
                'field_type' => $field['field_type'],
                'required' => $field['required'] ?? false,
                'options' => $field['options'] ?? null,
                'order' => $index,
            ]);
        }

        return response()->json($qaForm->load('fields'));
    }

    public function show($id)
    {
        return response()->json(QaForm::with('fields')->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $qaForm = QaForm::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'fields' => 'nullable|array',
            'fields.*.label' => 'required_with:fields|string',
            'fields.*.field_type' => 'required_with:fields|in:input,textarea,checkbox,slider,select',
            'fields.*.required' => 'boolean',
            'fields.*.options' => 'nullable|array',
        ]);

        if (isset($validated['title'])) $qaForm->title = $validated['title'];
        if (array_key_exists('description', $validated)) $qaForm->description = $validated['description'];
        $qaForm->save();

        if (!empty($validated['fields'])) {
            QaFormField::where('qa_form_id', $qaForm->id)->delete();
            foreach ($validated['fields'] as $index => $field) {
                QaFormField::create([
                    'qa_form_id' => $qaForm->id,
                    'label' => $field['label'],
                    'field_type' => $field['field_type'],
                    'required' => $field['required'] ?? false,
                    'options' => $field['options'] ?? null,
                    'order' => $index,
                ]);
            }
        }

        return response()->json($qaForm->load('fields'));
    }

    public function destroy($id)
    {
        $qaForm = QaForm::findOrFail($id);
        QaFormField::where('qa_form_id', $qaForm->id)->delete();
        $qaForm->delete();

        return response()->json(['message' => 'QA Form deleted successfully']);
    }
}
