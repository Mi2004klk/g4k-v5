import re

with open('apps/web/src/components/directory/departments-tab.tsx', 'r') as f:
    content = f.read()

# Import InlineEdit
content = content.replace('import { DataTable, StatusBadge } from "@g4k/ui/components";', 'import { DataTable, StatusBadge, InlineEdit } from "@g4k/ui/components";')

# Add updateDeptNameMutation
mutation_code = '''
  const updateDeptNameMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => apiFetch(/departments/, { method: "PUT", body: JSON.stringify({ name }) }),
    onSuccess: () => {
      toast.success("Department name updated!");
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
    },
    onError: (err: ApiError) => toast.error(err.message || "Failed to update department name."),
  });
'''
content = content.replace('const updateDeptMutation = useMutation({', mutation_code + '\n  const updateDeptMutation = useMutation({')

# Modify the column renderer for name
title_logic = '''
              {isAdmin ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <InlineEdit
                    value={row.original.name}
                    onSave={(val) => {
                      if (val && val !== row.original.name) {
                        updateDeptNameMutation.mutate({ id: row.original.id, name: val });
                      }
                    }}
                    className="font-semibold text-neutral-900 dark:text-white hover:underline decoration-violet-500 underline-offset-4"
                  />
                </div>
              ) : (
                <span
                  className="font-semibold text-neutral-900 dark:text-white block cursor-pointer hover:underline decoration-violet-500 underline-offset-4"
                  onClick={() => setSelectedDeptMembers(row.original)}
                >
                  {row.original.name}
                </span>
              )}
'''
content = re.sub(r'<span\s+className="font-semibold text-neutral-900 dark:text-white block cursor-pointer hover:underline decoration-violet-500 underline-offset-4"\s+onClick=\{[^}]+\}\s*>\s*\{row\.original\.name\}\s*</span>', title_logic.strip(), content)

with open('apps/web/src/components/directory/departments-tab.tsx', 'w') as f:
    f.write(content)

print("departments-tab updated")
