<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QaSubmission extends Model
{
    protected $fillable = ['task_id', 'qa_form_id', 'user_id', 'values', 'note'];

    protected $casts = [
        'values' => 'array',
    ];

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function qaForm(): BelongsTo
    {
        return $this->belongsTo(QaForm::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
