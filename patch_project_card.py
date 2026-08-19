import re

with open('apps/web/src/components/projects/project-card.tsx', 'r') as f:
    content = f.read()

# Add InlineEdit to imports
content = content.replace('import { Card, CardContent, CardHeader, CardTitle, Avatar, AvatarFallback } from "@g4k/ui/components";', 'import { Card, CardContent, CardHeader, CardTitle, Avatar, AvatarFallback, InlineEdit } from "@g4k/ui/components";')

# Add onUpdateName to props
content = content.replace('export function ProjectCard({ project, onClick }: { project: Project; onClick?: () => void }) {', 'export function ProjectCard({ project, onClick, onUpdateName }: { project: Project; onClick?: () => void; onUpdateName?: (name: string) => void }) {')

# Replace CardTitle rendering
title_logic = '''
              <CardTitle className="text-sm font-bold group-hover:text-primary-600 transition-colors">
                {onUpdateName ? (
                  <InlineEdit value={project.name} onSave={(val) => onUpdateName(val || project.name)} className="text-sm font-bold" />
                ) : (
                  project.name
                )}
              </CardTitle>
'''
content = re.sub(r'<CardTitle[^>]*>\s*\{project\.name\}\s*</CardTitle>', title_logic.strip(), content)

with open('apps/web/src/components/projects/project-card.tsx', 'w') as f:
    f.write(content)

print("ProjectCard updated")
