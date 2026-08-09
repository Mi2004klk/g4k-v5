<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoginAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'identifier',
        'user_id',
        'ip_address',
        'user_agent',
        'success',
        'is_suspicious',
    ];

    protected $casts = [
        'success' => 'boolean',
        'is_suspicious' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
