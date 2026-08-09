<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanyProfile extends Model
{
    protected $table = 'company_profile';

    protected $fillable = [
        'name',
        'short_name',
        'logo_url',
        'timezone',
        'branding',
        'updated_by',
    ];

    protected $casts = [
        'branding' => 'array',
    ];

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
