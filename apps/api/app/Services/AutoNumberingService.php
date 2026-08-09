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
                DB::table('auto_numberings')->insert([
                    'entity_type' => $entityType,
                    'prefix' => $prefix,
                    'start_number' => 1,
                    'current_number' => 1,
                    'format' => $prefix . '{000}',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                return sprintf("%s%03d", $prefix, 1);
            }

            $nextNumber = $record->current_number + 1;

            DB::table('auto_numberings')
                ->where('id', $record->id)
                ->update([
                    'current_number' => $nextNumber,
                    'updated_at' => now(),
                ]);

            if ($record->format && str_contains($record->format, '{000}')) {
                return str_replace('{000}', sprintf("%03d", $nextNumber), $record->format);
            }

            $prefix = $record->prefix ?? 'G4K';
            return sprintf("%s%03d", $prefix, $nextNumber);
        });
    }
}
