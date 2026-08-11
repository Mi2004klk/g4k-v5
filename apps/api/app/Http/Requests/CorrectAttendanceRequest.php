<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CorrectAttendanceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'action' => 'required|in:add_event,edit_event,remove_event',
            'attendance_day_id' => 'required|exists:attendance_days,id',
            'event_id' => 'nullable|exists:attendance_events,id',
            'type' => 'nullable|string|in:clock_in,clock_out,break_start,break_end',
            'timestamp' => 'nullable|date',
            'reason' => 'required|string|max:500',
        ];
    }
}
