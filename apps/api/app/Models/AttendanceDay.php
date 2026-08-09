<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceDay extends Model
{
    protected $guarded = [];

    protected $casts = [
        'clock_in' => 'datetime',
        'clock_out' => 'datetime',
        'first_event' => 'datetime',
        'last_event' => 'datetime',
        'has_open_shift' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
