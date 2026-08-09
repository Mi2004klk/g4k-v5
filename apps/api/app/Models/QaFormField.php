<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QaFormField extends Model
{
    protected $fillable = ['qa_form_id', 'label', 'field_type', 'required', 'options', 'order'];

    protected $casts = [
        'required' => 'boolean',
        'options' => 'array',
        'order' => 'integer',
    ];

    public function qaForm(): BelongsTo
    {
        return $this->belongsTo(QaForm::class);
    }
}
