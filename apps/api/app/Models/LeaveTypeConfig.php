<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeaveTypeConfig extends Model
{
    protected $fillable = [
        'key',
        'label',
        'default_allowed',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'default_allowed' => 'float',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];
}
