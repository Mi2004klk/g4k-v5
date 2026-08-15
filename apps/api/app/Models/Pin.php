<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pin extends Model
{
    use \App\Traits\HasDemoTag;
    protected $fillable = ['user_id',
        'type',
        'target_id',
        'label',
        'href',
        'icon', 'demo_tag'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
