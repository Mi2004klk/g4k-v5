const fs = require('fs');
let code = fs.readFileSync('apps/web/src/app/dashboard/tasks/page.tsx', 'utf8');

const stateToAdd = `  const [assigneeId, setAssigneeId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [qaFormId, setQaFormId] = useState("");
  const [blockedBy, setBlockedBy] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState("daily");
  const [recurrenceInterval, setRecurrenceInterval] = useState("1");
  
  const { data: usersData } = useQuery({ queryKey: queryKeys.users, queryFn: () => apiFetch("/users") });
  const { data: projectsData } = useQuery({ queryKey: queryKeys.projects, queryFn: () => apiFetch("/projects") });
  const { data: qaFormsData } = useQuery({ queryKey: ["qa-forms"], queryFn: () => apiFetch("/qa-forms") });
  
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const user = useAuthStore(s => s.user);`;

code = code.replace('  const [searchQuery, setSearchQuery] = useState("");', stateToAdd + '\n\n  const [searchQuery, setSearchQuery] = useState("");');

code = code.replace('import { format } from "date-fns";', 'import { format } from "date-fns";\nimport { useAuthStore } from "@/lib/auth-store";');

const mutationBody = `body: JSON.stringify({ 
          title, 
          description, 
          priority, 
          due_date: dueDate || null,
          assignee_id: assigneeId || null,
          project_id: projectId || null,
          qa_form_id: qaFormId || null,
          blocked_by: blockedBy || null,
          recurrence: isRecurring ? { pattern: recurrencePattern, interval: parseInt(recurrenceInterval) } : null
        }),`;
code = code.replace(/body: JSON\.stringify\({ title, description, priority, due_date: dueDate \|\| null }\),/, mutationBody);

const filteredTasksBody = `if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (assigneeFilter === "me" && t.assignee_id !== user?.id) return false;
      if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;`;
code = code.replace(/if \(statusFilter !== "all" && t\.status !== statusFilter\) return false;\s+if \(searchQuery && !t\.title\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\)\) return false;/, filteredTasksBody);

const filterBarAssignee = `{
                key: "assignee",
                label: "Assignee",
                type: "select",
                value: assigneeFilter,
                onChange: setAssigneeFilter,
                options: [
                  { label: "All Assignees", value: "all" },
                  { label: "My Tasks", value: "me" }
                ]
              },
              {`;
code = code.replace(/filters=\{\[\s+\{/, 'filters={[\n              ' + filterBarAssignee);

const newForm = `<div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">Title *</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Task title..."
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide context..."
                    className="w-full p-2 text-xs rounded border border-input bg-background resize-none"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full h-9 text-xs border border-input bg-background rounded-md px-2"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500">Due Date</label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500">Project</label>
                    <select
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="w-full h-9 text-xs border border-input bg-background rounded-md px-2"
                    >
                      <option value="">No Project</option>
                      {projectsData?.data?.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500">Assignee</label>
                    <select
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      className="w-full h-9 text-xs border border-input bg-background rounded-md px-2"
                    >
                      <option value="">Unassigned</option>
                      {usersData?.data?.map((u: any) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500">QA Form</label>
                    <select
                      value={qaFormId}
                      onChange={(e) => setQaFormId(e.target.value)}
                      className="w-full h-9 text-xs border border-input bg-background rounded-md px-2"
                    >
                      <option value="">None</option>
                      {qaFormsData?.map((q: any) => (
                        <option key={q.id} value={q.id}>{q.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500">Dependency (Blocked By)</label>
                    <select
                      value={blockedBy}
                      onChange={(e) => setBlockedBy(e.target.value)}
                      className="w-full h-9 text-xs border border-input bg-background rounded-md px-2"
                    >
                      <option value="">None</option>
                      {tasks?.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="rounded border-neutral-300" />
                    Recurring Task
                  </label>
                  {isRecurring && (
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-neutral-500">Pattern</label>
                        <select
                          value={recurrencePattern}
                          onChange={(e) => setRecurrencePattern(e.target.value)}
                          className="w-full h-9 text-xs border border-input bg-background rounded-md px-2"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-neutral-500">Interval</label>
                        <Input
                          type="number"
                          min="1"
                          value={recurrenceInterval}
                          onChange={(e) => setRecurrenceInterval(e.target.value)}
                          className="text-xs h-9"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !title}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold mt-4"
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Task"}
                </Button>
              </div>`;

code = code.replace(/<div className="space-y-4 py-4">[\s\S]*?<\/div>\s*<\/DialogContent>/, newForm + '\n            </DialogContent>');

fs.writeFileSync('apps/web/src/app/dashboard/tasks/page.tsx', code);
console.log('Patched tasks/page.tsx');
