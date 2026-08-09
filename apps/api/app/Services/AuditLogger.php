<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class AuditLogger
{
    public static function log($request, string $action, string $subjectType, $subjectId, ?array $before, ?array $after): void
    {
        DB::table('audit_logs')->insert([
            'user_id' => $request->user()?->id,
            'action' => $action,
            'subject_type' => $subjectType,
            'subject_id' => (string) $subjectId,
            'before' => $before ? json_encode($before) : null,
            'after' => $after ? json_encode($after) : null,
            'ip' => $request->ip(),
            'meta' => json_encode(['user_agent' => $request->userAgent()]),
            'at' => now(),
        ]);
    }
}
