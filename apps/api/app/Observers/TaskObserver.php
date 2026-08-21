<?php

namespace App\Observers;

use App\Models\Task;
use App\Models\Project;

class TaskObserver
{
    public function saved(Task $task)
    {
        $this->updateProjectProgress($task->project_id);
    }

    public function deleted(Task $task)
    {
        $this->updateProjectProgress($task->project_id);
    }

    protected function updateProjectProgress($projectId)
    {
        if (!$projectId) return;
        $project = Project::find($projectId);
        if (!$project) return;
        
        $total = $project->tasks()->count();
        if ($total === 0) {
            $project->updateQuietly(['progress' => 0]);
            return;
        }
        
        $done = $project->tasks()->where('status', 'done')->count();
        $progress = (int) round(($done / $total) * 100);
        
        $project->updateQuietly(['progress' => $progress]);
    }
}
