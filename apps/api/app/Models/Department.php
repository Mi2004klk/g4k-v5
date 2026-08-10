<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use \App\Traits\GeneratesAutoNumber;

    protected $fillable = ['department_id', 'company_id', 'name', 'description', 'is_active', 'archived_at'];
    protected $casts = ['archived_at' => 'datetime'];

    public $autoNumberField = 'department_id';
    public $autoNumberType = 'department';

    public function teams()
    {
        return $this->hasMany(Team::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
