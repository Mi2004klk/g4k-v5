<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;


    /**
     * DB-6 WARNING:
     * Currently, the database assumes a single-company architecture where names are globally unique.
     * If multi-company architecture is ever introduced, the unique constraints on the 'name' column
     * must be scoped to 'company_id' to prevent collisions between different tenants.
     */
class Designation extends Model
{
    protected $fillable = ['company_id', 'name', 'description', 'is_active'];

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
