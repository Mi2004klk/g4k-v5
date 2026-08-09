<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'company_id', 'name', 'short_name', 'type', 'description', 
    'primary_phone', 'secondary_phone', 'email', 'website', 'address', 'is_active'
])]
class Company extends Model
{
    use \App\Traits\GeneratesAutoNumber;

    public $autoNumberField = 'company_id';
    public $autoNumberType = 'company';

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
