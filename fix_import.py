import re

with open('apps/web/src/components/projects/tasks-tab.tsx', 'r') as f:
    content = f.read()

content = content.replace('  import { useEffect } from "react";\n\n  useEffect(() => {', '  useEffect(() => {')

with open('apps/web/src/components/projects/tasks-tab.tsx', 'w') as f:
    f.write(content)

print("Fixed import location")
