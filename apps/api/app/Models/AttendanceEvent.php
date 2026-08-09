<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceEvent extends Model
{
    protected $guarded = [];

    protected $casts = [
        'timestamp' => 'datetime',
        'device_meta' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
