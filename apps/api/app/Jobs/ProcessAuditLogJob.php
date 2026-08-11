<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class ProcessAuditLogJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $userId;
    public $action;
    public $subjectType;
    public $subjectId;
    public $before;
    public $after;
    public $ip;
    public $meta;
    public $at;

    public function __construct(
        $userId,
        string $action,
        string $subjectType,
        $subjectId,
        ?array $before,
        ?array $after,
        ?string $ip,
        ?array $meta,
        $at
    ) {
        $this->userId = $userId;
        $this->action = $action;
        $this->subjectType = $subjectType;
        $this->subjectId = (string) $subjectId;
        $this->before = $before;
        $this->after = $after;
        $this->ip = $ip;
        $this->meta = $meta;
        $this->at = $at;
    }

    public function handle(): void
    {
        DB::table('audit_logs')->insert([
            'user_id' => $this->userId,
            'action' => $this->action,
            'subject_type' => $this->subjectType,
            'subject_id' => $this->subjectId,
            'before' => $this->before ? json_encode($this->before) : null,
            'after' => $this->after ? json_encode($this->after) : null,
            'ip' => $this->ip,
            'meta' => $this->meta ? json_encode($this->meta) : null,
            'at' => $this->at,
        ]);
    }
}
