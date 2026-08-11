<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;


    /**
     * DB-6 WARNING:
     * Currently, the database assumes a single-company architecture where names are globally unique.
     * If multi-company architecture is ever introduced, the unique constraints on the 'name' column
     * must be scoped to 'company_id' to prevent collisions between different tenants.
     */
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
