<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->route('user') ?? $this->route('id');
        
        return [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $userId,
            'username' => 'sometimes|nullable|string|max:100|unique:users,username,' . $userId,
            'employee_id' => 'sometimes|nullable|string|max:50|unique:users,employee_id,' . $userId,
            'phone' => 'sometimes|nullable|string|max:20',
            'department_id' => 'sometimes|nullable|exists:departments,id',
            'team_id' => 'sometimes|nullable|exists:teams,id',
            'designation_id' => 'sometimes|nullable|exists:designations,id',
            'roles' => 'sometimes|array|min:1',
            'roles.*' => 'string|in:employee,hr,super_admin',
            'work_schedule_id' => 'nullable|exists:work_schedules,id',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:50',
            'emergency_contact_relation' => 'nullable|string|max:100',
        ];
    }
}
