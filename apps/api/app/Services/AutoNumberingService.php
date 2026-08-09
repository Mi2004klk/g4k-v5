<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class AutoNumberingService
{
    /**
     * Atomically generate the next sequence number for an entity type.
     */
    public static function generateNext(string $entityType): string
    {
        return DB::transaction(function () use ($entityType) {
            $record = DB::table('auto_numberings')
                ->where('entity_type', $entityType)
                ->lockForUpdate()
                ->first();

            if (!$record) {
                // Fallback default if not seeded
                $prefix = strtoupper(substr($entityType, 0, 3));
                $format = '{PREFIX}{000}';
                DB::table('auto_numberings')->insert([
                    'entity_type' => $entityType,
                    'prefix' => $prefix,
                    'start_number' => 1,
                    'current_number' => 1,
                    'format' => $format,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $record = DB::table('auto_numberings')->where('entity_type', $entityType)->first();
            } else {
                $record->current_number += 1;
                DB::table('auto_numberings')
                    ->where('id', $record->id)
                    ->update([
                        'current_number' => $record->current_number,
                        'updated_at' => now(),
                    ]);
            }

            return self::formatNumber($record->current_number, $record->prefix, $record->format);
        });
    }

    /**
     * Format a number using the prefix and format string.
     */
    public static function formatNumber(int $number, ?string $prefix, string $format): string
    {
        $result = $format;
        $result = str_replace('{PREFIX}', $prefix ?? '', $result);
        
        if (preg_match('/\{(0+)\}/', $result, $matches)) {
            $paddingLength = strlen($matches[1]);
            $paddedNumber = str_pad((string)$number, $paddingLength, '0', STR_PAD_LEFT);
            $result = str_replace($matches[0], $paddedNumber, $result);
        } else {
            $result = str_replace('{NUMBER}', (string)$number, $result);
        }

        return $result;
    }
}
