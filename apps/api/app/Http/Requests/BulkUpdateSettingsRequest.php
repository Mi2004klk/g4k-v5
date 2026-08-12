<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class BulkUpdateSettingsRequest extends FormRequest
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
        return [
            'settings' => 'required|array',
            'settings.*.category' => 'required|string|in:company,auto_numbering,policies,reminders,security,mail,notifications',
            'settings.*.key' => [
                'required',
                'string',
                function ($attribute, $value, $fail) {
                    $index = explode('.', $attribute)[1];
                    $category = $this->input("settings.$index.category");

                    $allowedKeys = [
                        'company' => ['name', 'timezone', 'logo_url'],
                        'auto_numbering' => ['format', 'next_number'],
                        'policies' => ['leave_policy', 'attendance_policy'],
                        'reminders' => ['daily_reminder_time', 'weekly_report_day'],
                        'security' => ['password.expiry_days', 'session.max_concurrent', 'session.access_token_ttl', 'session.refresh_token_ttl', 'password_history_limit', 'force_password_change'],
                        'mail' => ['host', 'port', 'username', 'password', 'encryption', 'from_address', 'from_name'],
                        'notifications' => ['leave_request.channels', 'attendance_reminder.channels', 'weekly_summary.channels']
                    ];

                    if (!isset($allowedKeys[$category]) || !in_array($value, $allowedKeys[$category])) {
                        $fail("The key {$value} is not allowed for category {$category}.");
                    }
                }
            ],
            'settings.*.value' => 'nullable|string|max:2000',
        ];
    }
}
