<?php

namespace App\Http\Controllers;

use App\Models\QaForm;
use App\Models\QaFormField;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QaController extends Controller
{
    public function index()
    {
        return response()->json(['data' => QaForm::with('fields')->latest()->limit(100)->get()]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_template' => 'boolean',
            'fields' => 'required|array|min:1',
            'fields.*.label' => 'required|string',
            'fields.*.field_type' => 'required|string|in:text,textarea,number,email,phone,url,multiple_choice,checkbox,dropdown,boolean,linear_scale,rating,slider,file_upload,date,time,datetime,signature,section',
            'fields.*.required' => 'boolean',
            'fields.*.options' => 'nullable|array',
            'fields.*.section_id' => 'nullable|string',
            'fields.*.branching_logic' => 'nullable|array',
            'fields.*.config' => 'nullable|array',
            'fields.*.validation' => 'nullable|array',
        ]);

        $qaForm = QaForm::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'is_template' => $validated['is_template'] ?? true,
            'created_by' => $request->user()->id,
        ]);

        foreach ($validated['fields'] as $index => $field) {
            QaFormField::create([
                'qa_form_id' => $qaForm->id,
                'label' => $field['label'],
                'field_type' => $field['field_type'],
                'required' => $field['required'] ?? false,
                'options' => $field['options'] ?? null,
                'section_id' => $field['section_id'] ?? null,
                'branching_logic' => $field['branching_logic'] ?? null,
                'config' => $field['config'] ?? null,
                'validation' => $field['validation'] ?? null,
                'order' => $index,
            ]);
        }

        return response()->json(['data' => $qaForm->load('fields')]);
    }

    public function show($id)
    {
        return response()->json(['data' => QaForm::with('fields')->findOrFail($id)]);
    }

    public function update(Request $request, $id)
    {
        $qaForm = QaForm::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'is_template' => 'boolean',
            'fields' => 'nullable|array',
            'fields.*.label' => 'required_with:fields|string',
            'fields.*.field_type' => 'required_with:fields|string|in:text,textarea,number,email,phone,url,multiple_choice,checkbox,dropdown,boolean,linear_scale,rating,slider,file_upload,date,time,datetime,signature,section',
            'fields.*.required' => 'boolean',
            'fields.*.options' => 'nullable|array',
            'fields.*.section_id' => 'nullable|string',
            'fields.*.branching_logic' => 'nullable|array',
            'fields.*.config' => 'nullable|array',
            'fields.*.validation' => 'nullable|array',
        ]);

        if (isset($validated['title'])) $qaForm->title = $validated['title'];
        if (array_key_exists('description', $validated)) $qaForm->description = $validated['description'];
        if (array_key_exists('is_template', $validated)) $qaForm->is_template = $validated['is_template'];
        $qaForm->save();

        if (!empty($validated['fields'])) {
            DB::transaction(function () use ($qaForm, $validated) {
                QaFormField::where('qa_form_id', $qaForm->id)->delete();
                foreach ($validated['fields'] as $index => $field) {
                    QaFormField::create([
                        'qa_form_id' => $qaForm->id,
                        'label' => $field['label'],
                        'field_type' => $field['field_type'],
                        'required' => $field['required'] ?? false,
                        'options' => $field['options'] ?? null,
                        'section_id' => $field['section_id'] ?? null,
                        'branching_logic' => $field['branching_logic'] ?? null,
                        'config' => $field['config'] ?? null,
                        'validation' => $field['validation'] ?? null,
                        'order' => $index,
                    ]);
                }
            });
        }

        return response()->json(['data' => $qaForm->load('fields')]);
    }

    public function destroy($id)
    {
        $qaForm = QaForm::findOrFail($id);

        if (\App\Models\Task::where('qa_form_id', $qaForm->id)->exists()) {
            return response()->json(['message' => 'Cannot delete QA Form because it is used by one or more tasks.'], 409);
        }

        if (\App\Models\Project::where('qa_form_id', $qaForm->id)->exists()) {
            return response()->json(['message' => 'Cannot delete QA Form because it is used by one or more projects.'], 409);
        }

        if (\App\Models\QaSubmission::where('qa_form_id', $qaForm->id)->exists()) {
            return response()->json(['message' => 'Cannot delete QA Form because it has historical submissions.'], 409);
        }

        QaFormField::where('qa_form_id', $qaForm->id)->delete();
        $qaForm->delete();

        return response()->json(['message' => 'QA Form deleted successfully']);
    }
}
