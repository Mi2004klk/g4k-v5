<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Holiday extends Model
{
    protected $fillable = [
        'name', 'date', 'recurring', 'description', 'type', 'location', 'start_time'
    ];

    protected $casts = [
        'date' => 'date',
        'recurring' => 'boolean',
    ];
}
