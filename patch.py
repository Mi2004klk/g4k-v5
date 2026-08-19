import re

with open('apps/web/src/components/tasks/qa-form-builder.tsx', 'r') as f:
    content = f.read()

# Add useQuery
content = content.replace('import { useMutation, useQueryClient } from "@tanstack/react-query";', 'import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";')

# Add ConfirmDialog
content = content.replace('import { Dialog, DialogContent } from "@g4k/ui/components";', 'import { Dialog, DialogContent, ConfirmDialog } from "@g4k/ui/components";')

# Add states and hooks
hooks = '''
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: qaFormsData, isLoading: isLoadingForms } = useQuery({ 
    queryKey: queryKeys.qaForms, 
    queryFn: () => apiFetch("/qa-forms") 
  });
  
  const forms = Array.isArray(qaFormsData?.data) ? qaFormsData.data : Array.isArray(qaFormsData) ? qaFormsData : [];

  const updateFormMutation = useMutation({
    mutationFn: async () => {
      let currentSectionId: string | null = null;
      const apiFields = fields.map((f) => {
        if (f.field_type === "section") {
          currentSectionId = f.id;
        }
        return {
          label: f.label,
          field_type: f.field_type,
          required: f.required,
          options: f.options,
          section_id: currentSectionId,
          branching_logic: f.branching_logic
        };
      });

      return apiFetch(/qa-forms/, {
        method: "PUT",
        body: JSON.stringify({ title, description, is_template: true, fields: apiFields }),
      });
    },
    onSuccess: () => {
      toast.success("QA Form Template updated successfully.");
      setEditingId(null);
      setTitle("");
      setDescription("");
      setFields([
        { id: generateId(), label: "First Section", field_type: "section", required: false, options: [], branching_logic: null },
        { id: generateId(), label: "Check Code Formatting", field_type: "checkbox", required: true, options: [], branching_logic: null }
      ]);
      queryClient.invalidateQueries({ queryKey: queryKeys.qaForms });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update QA form.");
    },
  });

  const deleteFormMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(/qa-forms/, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("QA Form deleted.");
      queryClient.invalidateQueries({ queryKey: queryKeys.qaForms });
      setIsDeleteOpen(false);
      if (editingId === deletingId) {
        setEditingId(null);
        setTitle("");
        setDescription("");
        setFields([]);
      }
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete QA form."),
  });

  const handleEdit = (form: any) => {
    setEditingId(form.id);
    setTitle(form.title || "");
    setDescription(form.description || "");
    const parsedFields = Array.isArray(form.fields) ? form.fields : [];
    setFields(parsedFields.map((f: any) => ({ ...f, id: f.id || generateId() })));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setFields([
      { id: generateId(), label: "First Section", field_type: "section", required: false, options: [], branching_logic: null },
      { id: generateId(), label: "Check Code Formatting", field_type: "checkbox", required: true, options: [], branching_logic: null }
    ]);
  };
'''

content = content.replace('  const [fields, setFields] = useState<QAField[]>([', hooks + '\n  const [fields, setFields] = useState<QAField[]>([')

# Change layout to flex
layout_wrapper = '''
    <div className="flex gap-4 h-full">
      <Card className="w-80 shrink-0 border border-neutral-200 dark:border-neutral-800 shadow-e1 rounded-xl overflow-hidden h-full flex flex-col">
        <CardHeader className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 py-3">
          <CardTitle className="text-sm font-bold">Existing QA Forms</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
          {isLoadingForms ? (
            <div className="p-4 text-center text-xs text-neutral-500">Loading forms...</div>
          ) : forms.length === 0 ? (
            <div className="p-4 text-center text-xs text-neutral-500">No QA forms found.</div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {forms.map((form: any) => (
                <div key={form.id} className={p-4 flex flex-col gap-2 transition-colors }>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="text-sm font-semibold">{form.title}</h4>
                      {form.description && <p className="text-xs text-neutral-500 line-clamp-2">{form.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end mt-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => handleEdit(form)}>
                      <AppIcon name="edit" size="xs" className="mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="destructive" className="h-7 text-xs px-2" onClick={() => { setDeletingId(form.id); setIsDeleteOpen(true); }}>
                      <AppIcon name="trash" size="xs" className="mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="flex-1 border border-neutral-200 dark:border-neutral-800 shadow-e1 rounded-xl overflow-hidden h-full flex flex-col">
'''

content = content.replace('<Card className="border border-neutral-200 dark:border-neutral-800 shadow-e1 rounded-xl overflow-hidden h-full">', layout_wrapper)
content = content.replace('Create QA Form Template', '{editingId ? "Edit QA Form Template" : "Create QA Form Template"}')

save_button = '''
        <div className="flex gap-2">
          {editingId && (
            <Button
              variant="outline"
              onClick={handleCancelEdit}
              className="font-semibold h-10 text-sm w-1/3"
            >
              Cancel Edit
            </Button>
          )}
          <Button
            onClick={() => editingId ? updateFormMutation.mutate() : createFormMutation.mutate()}
            disabled={createFormMutation.isPending || updateFormMutation.isPending || !title || fields.length === 0}
            className={ont-semibold h-10 text-sm flex-1  text-white}
          >
            {createFormMutation.isPending || updateFormMutation.isPending ? <AppIcon name="loading" size="sm" className="animate-spin" /> : (editingId ? "Update QA Template" : "Save QA Template")}
          </Button>
        </div>
'''

content = re.sub(r'<Button[^>]*onClick=\{\(\) => createFormMutation\.mutate\(\)\}[^>]*>.*?</Button>', save_button, content, flags=re.DOTALL)

end_wrapper = '''
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete QA Form"
        description="Are you sure you want to delete this QA form? This action cannot be undone."
        confirmText="Delete Form"
        onConfirm={() => deletingId && deleteFormMutation.mutate(deletingId)}
      />
    </div>
'''

content = content.replace('</Card>\n  );', '</Card>\n' + end_wrapper + '\n  );')

with open('apps/web/src/components/tasks/qa-form-builder.tsx', 'w') as f:
    f.write(content)

print("Done")
