<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceDay extends Model
{
    use \App\Traits\HasDemoTag;
    protected $fillable = ['user_id',
        'date',
        'status',
        'clock_in',
        'clock_out',
        'first_event',
        'last_event',
        'has_open_shift',
        'is_flagged',
        'total_seconds',
        'break_seconds',
        'unapproved_break_seconds',
        'late_minutes',
        'overtime_seconds',
        'source',
        'version', 'demo_tag'];

    protected $casts = [
        'clock_in' => 'datetime',
        'clock_out' => 'datetime',
        'first_event' => 'datetime',
        'last_event' => 'datetime',
        'has_open_shift' => 'boolean',
        'is_flagged' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
