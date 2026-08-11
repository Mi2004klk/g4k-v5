<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use App\Jobs\ProcessAuditLogJob;

class AuditLogger
{
    public static function log($request, string $action, string $subjectType, $subjectId, ?array $before, ?array $after): void
    {
        ProcessAuditLogJob::dispatch(
            $request->user()?->id,
            $action,
            $subjectType,
            $subjectId,
            $before,
            $after,
            $request->ip(),
            ['user_agent' => $request->userAgent()],
            now()
        );
    }
}
