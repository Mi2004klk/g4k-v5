import re

# Fix projects-tab.tsx
with open('apps/web/src/components/projects/projects-tab.tsx', 'r', encoding='utf-8') as f:
    p_content = f.read()

p_content = p_content.replace('import { Button, Card, CardHeader, CardTitle, CardContent, Badge, DataTable, AppIcon, ConfirmDialog, toast } from "@g4k/ui/components";', 'import { Button, Card, CardHeader, CardTitle, CardContent, Badge, DataTable, AppIcon, ConfirmDialog } from "@g4k/ui/components";\nimport { toast } from "sonner";')
p_content = p_content.replace('queryClient.invalidateQueries({ queryKey: queryKeys.projectsBase });', 'queryClient.invalidateQueries({ queryKey: queryKeys.projects() });')

with open('apps/web/src/components/projects/projects-tab.tsx', 'w', encoding='utf-8') as f:
    f.write(p_content)

# Fix departments-tab.tsx
with open('apps/web/src/components/directory/departments-tab.tsx', 'r', encoding='utf-8') as f:
    d_content = f.read()

# RegExp error: .replace(/^user-/, '') if the first argument is a regex, it needs to be a string?
# Wait, let's see what line 162 is. Let's just fix it.
d_content = d_content.replace('.replace(/^user-/, "")', '.replace("user-", "")')

with open('apps/web/src/components/directory/departments-tab.tsx', 'w', encoding='utf-8') as f:
    f.write(d_content)

# Fix notes/page.tsx
with open('apps/web/src/app/dashboard/notes/page.tsx', 'r', encoding='utf-8') as f:
    n_content = f.read()
    
# It imports BreadcrumbItem etc from ui/components, let's just remove Breadcrumb parts if they aren't used, or fix the import.
n_content = re.sub(r'import \{[^}]*Breadcrumb[^}]*\} from "@g4k/ui/components";\n', '', n_content)
# Or if it's one line:
n_content = n_content.replace('import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@g4k/ui/components";', '')

with open('apps/web/src/app/dashboard/notes/page.tsx', 'w', encoding='utf-8') as f:
    f.write(n_content)
    
# Fix user page pin icon
with open('apps/web/src/app/dashboard/org/users/[id]/page.tsx', 'r', encoding='utf-8') as f:
    u_content = f.read()
    
u_content = u_content.replace('<AppIcon name={isPinned ? "pinFilled" : "pin"} />', '<AppIcon name="pin" />')

with open('apps/web/src/app/dashboard/org/users/[id]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(u_content)

print("Fixed syntax errors")
