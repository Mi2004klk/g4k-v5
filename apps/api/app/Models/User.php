<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable([
    'company_id', 'employee_id', 'name', 'username', 'email', 'password',
    'department_id', 'team_id', 'designation_id', 'phone', 'alternate_mobile',
    'emergency_contact', 'joining_date', 'blood_group', 'working_hours',
    'must_change_password', 'status', 'avatar_url', 'preferences', 'work_schedule_id'
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, \Laravel\Sanctum\HasApiTokens, \App\Traits\GeneratesAutoNumber;

    public $autoNumberField = 'employee_id';
    public $autoNumberType = 'employee';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'must_change_password' => 'boolean',
            'joining_date' => 'date',
            'preferences' => 'array',
        ];
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function designation()
    {
        return $this->belongsTo(Designation::class);
    }

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function roles()
    {
        return $this->hasMany(RoleAssignment::class);
    }

    public function roleAssignments()
    {
        return $this->hasMany(RoleAssignment::class);
    }

    public function pins()
    {
        return $this->hasMany(Pin::class);
    }

    public function attendanceDays()
    {
        return $this->hasMany(AttendanceDay::class);
    }

    public function leaveRequests()
    {
        return $this->hasMany(LeaveRequest::class);
    }
}
