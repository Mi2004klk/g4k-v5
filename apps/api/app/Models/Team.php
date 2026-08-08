<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    protected $fillable = ['department_id', 'name', 'description'];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
