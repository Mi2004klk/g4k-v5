<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pin extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'target_id',
        'label',
        'href',
        'icon',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
