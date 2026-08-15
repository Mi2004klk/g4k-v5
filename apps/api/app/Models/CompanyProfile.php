<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanyProfile extends Model
{
    use \App\Traits\HasDemoTag;
    protected $table = 'company_profile';

    protected $fillable = ['name',
        'short_name',
        'logo_url',
        'timezone',
        'branding',
        'updated_by', 'demo_tag'];

    protected $casts = [
        'branding' => 'array',
    ];

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
