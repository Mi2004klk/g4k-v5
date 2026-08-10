<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceEvent extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'timestamp',
        'device_meta',
        'source',
        'client_id'
    ];

    protected $casts = [
        'timestamp' => 'datetime',
        'device_meta' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
