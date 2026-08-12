const fs = require('fs');

let code = fs.readFileSync('apps/api/app/Console/Commands/SendWeeklySummaryCommand.php', 'utf8');

const oldMetrics = `        $metrics = [
            'tasks_completed' => Task::where('status', 'completed')->count(),
            'active_projects' => Project::where('status', 'in_progress')->count(),
        ];`;

const newMetrics = `        $start = now()->startOfWeek();
        $end = now()->endOfWeek();
        
        $metrics = [
            'tasks_completed' => Task::where('status', 'completed')
                ->whereBetween('created_at', [$start, $end])
                ->count(),
            'active_projects' => Project::where('status', 'active')
                ->whereBetween('created_at', [$start, $end])
                ->count(),
        ];`;

code = code.replace(oldMetrics, newMetrics);

fs.writeFileSync('apps/api/app/Console/Commands/SendWeeklySummaryCommand.php', code);
console.log('Patched SendWeeklySummaryCommand.php');
