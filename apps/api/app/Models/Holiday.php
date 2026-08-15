<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Holiday extends Model
{
    use \App\Traits\HasDemoTag;
    protected $fillable = ['name', 'date', 'recurring', 'description', 'type', 'location', 'start_time', 'demo_tag', 'is_demo'];

    protected $casts = [
        'date' => 'date',
        'recurring' => 'boolean',
    ];
}
