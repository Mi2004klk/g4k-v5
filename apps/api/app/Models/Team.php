<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    use \App\Traits\HasDemoTag;
    protected $fillable = ['company_id', 'department_id', 'name', 'description', 'demo_tag', 'is_demo'];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
