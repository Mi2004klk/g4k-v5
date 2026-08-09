<?php

namespace App\Traits;

use App\Models\AutoNumbering;
use Illuminate\Database\Eloquent\Model;

trait GeneratesAutoNumber
{
    /**
     * Boot the trait and hook into model creating event.
     */
    protected static function bootGeneratesAutoNumber()
    {
        static::creating(function (Model $model) {
            $field = $model->autoNumberField ?? 'id';
            $entityType = $model->autoNumberType ?? strtolower(class_basename($model));

            if (empty($model->{$field})) {
                $model->{$field} = AutoNumbering::generateNext($entityType);
            }
        });
    }
}
