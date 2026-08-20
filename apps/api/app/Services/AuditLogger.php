<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use App\Jobs\ProcessAuditLogJob;

class AuditLogger
{
    public static function log($request, string $action, string $subjectType, $subjectId, ?array $before, ?array $after, ?int $actorId = null): void
    {
        ProcessAuditLogJob::dispatchSync(
            $actorId ?? $request->user()?->id,
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
