<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AutoNumbering extends Model
{
    use \App\Traits\HasDemoTag;
    protected $fillable = ['entity_type', 'prefix', 'start_number', 'current_number', 'format', 'demo_tag'];

    public static function generateNext(string $entityType): string
    {
        return \App\Services\AutoNumberingService::generateNext($entityType);
    }
}
