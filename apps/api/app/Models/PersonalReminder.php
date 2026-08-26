<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PersonalReminder extends Model
{
    use \App\Traits\HasDemoTag;

    protected $fillable = [
        'user_id',
        'title',
        'body',
        'link',
        'remind_at',
        'status',
        'demo_tag'
    ];

    protected $casts = [
        'remind_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
