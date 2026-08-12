const fs = require('fs');

let code = fs.readFileSync('apps/api/app/Http/Controllers/ReportController.php', 'utf8');

// Productivity computation in data()
const oldDataUsers = `            case 'users':
            case 'productivity':
            default:
                $query = User::query();
                if (!$hasManage) {
                    $query->where('department_id', $user->department_id);
                }
                $data = $query->latest()->paginate(25);
                break;`;

const newDataUsers = `            case 'users':
            case 'productivity':
            default:
                $query = User::query();
                if (!$hasManage) {
                    $query->where('department_id', $user->department_id);
                }
                
                if ($key === 'productivity') {
                    $query->withCount([
                        'assignedTasks as completed_tasks' => function($q) {
                            $q->where('status', 'completed');
                        },
                        'assignedTasks as total_tasks'
                    ])->withSum('taskTimeLogs as total_seconds', 'duration_seconds');
                }

                if ($request->filled('search')) {
                    $search = $request->search;
                    $query->where('name', 'ilike', "%{$search}%");
                }
                
                $data = $query->latest()->paginate(25);

                if ($key === 'productivity') {
                    $data->getCollection()->transform(function($u) {
                        $rate = $u->total_tasks > 0 ? ($u->completed_tasks / $u->total_tasks) : 0;
                        $hours = $u->total_seconds / 3600;
                        $u->productivity_score = round($rate * $hours, 2);
                        return $u;
                    });
                }
                break;`;
code = code.replace(oldDataUsers, newDataUsers);

// Inject filters in export()
const oldExport = `        $exportJob = ExportJob::create([
            'user_id' => $request->user()->id,
            'report_key' => $validated['key'],
            'format' => $validated['format'],
            'filters' => $validated['filters'] ?? [],
            'status' => 'pending',
        ]);`;

const newExport = `        $filters = $validated['filters'] ?? [];
        $filters['_has_manage'] = $this->userHasManage($request);
        $filters['_department_id'] = $request->user()->department_id;
        $filters['_user_id'] = $request->user()->id;

        $exportJob = ExportJob::create([
            'user_id' => $request->user()->id,
            'report_key' => $validated['key'],
            'format' => $validated['format'],
            'filters' => $filters,
            'status' => 'pending',
        ]);`;
code = code.replace(oldExport, newExport);

fs.writeFileSync('apps/api/app/Http/Controllers/ReportController.php', code);
console.log('Patched ReportController.php');
