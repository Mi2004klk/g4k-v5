import re

with open('apps/web/src/components/projects/tasks-tab.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('import { useAuthStore } from "@/lib/auth-store";', 'import { useAuthStore } from "@/lib/auth-store";\nimport { useFormDraft } from "@/hooks/use-form-draft";\nimport { Alert, AlertDescription, AlertTitle } from "@g4k/ui/components";')

hook_code = '''
  const { formData: draftData, setFormData: setDraftData, hasDraft, restoreDraft, clearDraft } = useFormDraft("task_create", {
    title: "", description: "", priority: "medium", dueDate: "", assigneeIds: [] as number[], projectId: defaultProjectId || "", scope: "global", qaFormId: "", blockedBy: "", isRecurring: false, recurrencePattern: "daily", recurrenceDays: [] as number[], dayOfMonth: 1
  });

  useEffect(() => {
    setDraftData({
      title, description, priority, dueDate, assigneeIds, projectId, scope, qaFormId, blockedBy, isRecurring, recurrencePattern, recurrenceDays, dayOfMonth
    });
  }, [title, description, priority, dueDate, assigneeIds, projectId, scope, qaFormId, blockedBy, isRecurring, recurrencePattern, recurrenceDays, dayOfMonth, setDraftData]);

  const handleRestoreDraft = async () => {
    const saved = await restoreDraft();
    if (saved) {
      setTitle(saved.title || "");
      setDescription(saved.description || "");
      setPriority(saved.priority || "medium");
      setDueDate(saved.dueDate || "");
      setAssigneeIds(saved.assigneeIds || []);
      setProjectId(saved.projectId || defaultProjectId || "");
      setScope(saved.scope || "global");
      setQaFormId(saved.qaFormId || "");
      setBlockedBy(saved.blockedBy || "");
      setIsRecurring(saved.isRecurring || false);
      setRecurrencePattern(saved.recurrencePattern || "daily");
      setRecurrenceDays(saved.recurrenceDays || []);
      setDayOfMonth(saved.dayOfMonth || 1);
    }
  };
'''

# We need to find where to inject hook_code
content = content.replace('const [dayOfMonth, setDayOfMonth] = useState<number>(1);', 'const [dayOfMonth, setDayOfMonth] = useState<number>(1);\n' + hook_code)

alert_code = '''
          {hasDraft && (
            <Alert className="mb-4 bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900">
              <AlertTitle className="text-blue-800 dark:text-blue-300 flex items-center gap-2 text-sm">
                <AppIcon name="history" size="sm" />
                Draft Available
              </AlertTitle>
              <AlertDescription className="text-blue-700/80 dark:text-blue-400 text-xs flex items-center justify-between mt-1">
                <span>You have an unsaved draft.</span>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={handleRestoreDraft}>Restore</Button>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40" onClick={clearDraft}>Discard</Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
'''

content = content.replace('<div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">', '<div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">\n' + alert_code)

content = content.replace('setDueDate("");', 'setDueDate(""); clearDraft();')

with open('apps/web/src/components/projects/tasks-tab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("tasks-tab updated")
