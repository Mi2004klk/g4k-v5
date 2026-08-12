const fs = require('fs');

let code = fs.readFileSync('apps/api/app/Http/Controllers/SavedViewController.php', 'utf8');

const oldIndex = `    public function index(Request $request)
    {
        $entity = $request->query('entity', 'tasks');
        $views = SavedView::where('user_id', $request->user()->id)
            ->where('entity', $entity)
            ->limit(100)
            ->get();
        return response()->json($views);
    }`;

const newIndex = `    public function index(Request $request)
    {
        $module = $request->query('module', 'tasks');
        $views = SavedView::where('user_id', $request->user()->id)
            ->where('entity', $module)
            ->limit(100)
            ->get()
            ->map(function ($view) {
                return [
                    'id' => $view->id,
                    'name' => $view->name,
                    'module' => $view->entity,
                    'filters' => $view->config,
                ];
            });
        return response()->json($views);
    }`;

code = code.replace(oldIndex, newIndex);

const oldStore = `    public function store(Request $request)
    {
        $validated = $request->validate([
            'entity' => 'required|in:tasks,projects',
            'name' => 'required|string|max:255',
            'config' => 'required|array',
        ]);

        $view = SavedView::create([
            'user_id' => $request->user()->id,
            'entity' => $validated['entity'],
            'name' => $validated['name'],
            'config' => $validated['config'],
        ]);

        return response()->json($view);
    }`;

const newStore = `    public function store(Request $request)
    {
        $validated = $request->validate([
            'module' => 'required|in:tasks,projects,attendance',
            'name' => 'required|string|max:255',
            'filters' => 'required|array',
        ]);

        $view = SavedView::create([
            'user_id' => $request->user()->id,
            'entity' => $validated['module'],
            'name' => $validated['name'],
            'config' => $validated['filters'],
        ]);

        return response()->json([
            'id' => $view->id,
            'name' => $view->name,
            'module' => $view->entity,
            'filters' => $view->config,
        ]);
    }`;

code = code.replace(oldStore, newStore);

fs.writeFileSync('apps/api/app/Http/Controllers/SavedViewController.php', code);
console.log('Patched SavedViewController.php');
