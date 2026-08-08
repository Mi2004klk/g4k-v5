<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

use Laravel\Sanctum\HasApiTokens;
use App\Models\AutoNumbering;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'employee_id',
        'password',
        'must_change_password',
        'onboarded_at',
        'status',
        'lockout_until',
        'login_attempts',
        'avatar_url',
        'department_id',
        'team_id',
        'designation_id',
        'phone',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

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
            'onboarded_at' => 'datetime',
            'lockout_until' => 'datetime',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($user) {
            if (empty($user->employee_id)) {
                $user->employee_id = AutoNumbering::generateNext('user');
            }
        });
    }

    public function roleAssignments()
    {
        return $this->hasMany(RoleAssignment::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function designation()
    {
        return $this->belongsTo(Designation::class);
    }
}
