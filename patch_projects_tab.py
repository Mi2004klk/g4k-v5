import re

with open('apps/web/src/components/projects/projects-tab.tsx', 'r') as f:
    content = f.read()

# Add useMutation and useQueryClient to imports
content = content.replace('import { useQuery, keepPreviousData } from "@tanstack/react-query";', 'import { useQuery, keepPreviousData, useMutation, useQueryClient } from "@tanstack/react-query";')
content = content.replace('import { Button, FilterBar } from "@g4k/ui/components";', 'import { Button, FilterBar, toast } from "@g4k/ui/components";')

# Add mutation inside ProjectsTab
mutation_code = '''
  const queryClient = useQueryClient();
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      return apiFetch(/projects/, {
        method: "PUT",
        body: JSON.stringify({ name }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectsBase });
      toast.success("Project updated.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update project.");
    }
  });
'''
content = content.replace('const debouncedSearch = useDebounce(search, 250);', debouncedSearch_code) # Wait I didn't define debouncedSearch_code!

# Better to use replace
content = content.replace('const canManageProjects = hasCapability(caps, "projects.manage");', f'const canManageProjects = hasCapability(caps, "projects.manage");\n{mutation_code}')

# Pass onUpdateName to ProjectCard
content = content.replace('<ProjectCard \n                key={project.id} \n                project={project} \n                onClick={() => router.push(/dashboard/projects/)}\n              />', '<ProjectCard \n                key={project.id} \n                project={project} \n                onClick={() => router.push(/dashboard/projects/)}\n                onUpdateName={canManageProjects ? (name) => updateProjectMutation.mutate({ id: project.id, name }) : undefined}\n              />')

with open('apps/web/src/components/projects/projects-tab.tsx', 'w') as f:
    f.write(content)

print("projects-tab updated")
