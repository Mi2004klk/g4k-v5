<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QaFormField extends Model
{
    use \App\Traits\HasDemoTag;
    protected $fillable = ['qa_form_id', 'label', 'field_type', 'required', 'options', 'order', 'demo_tag', 'section_id', 'branching_logic', 'config', 'validation'];

    protected $casts = [
        'required' => 'boolean',
        'options' => 'array',
        'branching_logic' => 'array',
        'config' => 'array',
        'validation' => 'array',
        'order' => 'integer',
    ];

    public function qaForm(): BelongsTo
    {
        return $this->belongsTo(QaForm::class);
    }
}
