<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AutoNumbering extends Model
{
    protected $fillable = ['entity_type', 'prefix', 'start_number', 'current_number', 'format'];

    /**
     * Generate the next number for a given entity type.
     */
    public static function generateNext(string $entityType): string
    {
        $config = self::firstOrCreate(
            ['entity_type' => $entityType],
            ['prefix' => strtoupper(substr($entityType, 0, 3)), 'start_number' => 1, 'current_number' => 0, 'format' => '{PREFIX}-{NUMBER}']
        );

        $config->current_number++;
        $config->save();

        $numberStr = str_pad($config->current_number, 4, '0', STR_PAD_LEFT);
        
        $format = $config->format;
        $format = str_replace('{PREFIX}', $config->prefix, $format);
        $format = str_replace('{NUMBER}', $numberStr, $format);

        return $format;
    }
}
