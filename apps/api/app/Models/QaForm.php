<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QaForm extends Model
{
    use \App\Traits\HasDemoTag;
    protected $fillable = ['title', 'description', 'created_by', 'demo_tag', 'is_demo', 'is_template'];

    protected $casts = [
        'is_template' => 'boolean',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function fields(): HasMany
    {
        return $this->hasMany(QaFormField::class)->orderBy('order');
    }
}
