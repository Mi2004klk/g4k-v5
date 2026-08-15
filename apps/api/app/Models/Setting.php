<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Setting extends Model
{
    use \App\Traits\HasDemoTag;
    protected $fillable = ['category',
        'key',
        'value',
        'updated_by', 'demo_tag'];

    protected $casts = [
        'value' => 'array',
    ];

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
