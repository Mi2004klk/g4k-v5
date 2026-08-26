<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaveBalance extends Model
{
    use \App\Traits\HasDemoTag;
    use HasFactory;

    protected $fillable = ['user_id',
        'leave_type',
        'year',
        'allowed',
        'used', 'demo_tag'];

    protected $casts = [
        'year' => 'integer',
        'allowed' => 'integer',
        'used' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get or create a leave balance allocation for a user, type, and year.
     */
    public static function getOrCreate(int $userId, string $type, ?int $year = null): self
    {
        $year = $year ?? (int) date('Y');
        $defaults = [
            'casual' => 12,
            'sick' => 12,
            'annual' => 12,
            'earned' => 12,
            'unpaid' => 12,
        ];

        $allowed = $defaults[strtolower($type)] ?? 12;

        return static::firstOrCreate(
            ['user_id' => $userId, 'leave_type' => strtolower($type), 'year' => $year],
            ['allowed' => $allowed, 'used' => 0]
        );
    }
}
