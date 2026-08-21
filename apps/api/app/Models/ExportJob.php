<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExportJob extends Model
{
    use \App\Traits\HasDemoTag;
    protected $fillable = ['user_id',
        'report_key',
        'filters',
        'format',
        'status',
        'file_path',
        'file_data',
        'file_size',
        'error_message', 'demo_tag'];

    protected $casts = [
        'filters' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
