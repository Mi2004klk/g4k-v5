<?php

namespace App\Listeners;

use App\Events\TaskCompleted;
use App\Models\Conversation;
use App\Models\Message;
use App\Events\MessageSent;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class PostTaskCompletionToGlobalChat implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(TaskCompleted $event): void
    {
        try {
            $task = $event->task;
            $user = $event->user;

            $globalConv = Conversation::where('scope', 'global')->first();
            if ($globalConv) {
                $assigneeName = $task->assignee ? $task->assignee->name : 'Unassigned';
                $msg = Message::create([
                    'conversation_id' => $globalConv->id,
                    'sender_id' => $user->id,
                    'body' => "✅ **Task Completed**: \"{$task->title}\" by {$assigneeName}",
                    'type' => 'text',
                ]);
                broadcast(new MessageSent($msg))->toOthers();
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Failed to post task completion to global chat: " . $e->getMessage());
        }
    }
}
