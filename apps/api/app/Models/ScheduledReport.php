<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduledReport extends Model
{
    use \App\Traits\HasDemoTag;
    protected $fillable = ['user_id',
        'report_key',
        'schedule',
        'configuration',
        'status', 'demo_tag'];

    protected $casts = [
        'configuration' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
