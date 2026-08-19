import re

with open('apps/web/src/components/tasks/task-kanban-board.tsx', 'r') as f:
    content = f.read()

# Add id to TaskCard Card
content = content.replace('<Card\n      onClick={() => onTaskSelect?.(task)}\n      className={cn(', '<Card\n      id={data-row-}\n      onClick={() => onTaskSelect?.(task)}\n      className={cn(')

with open('apps/web/src/components/tasks/task-kanban-board.tsx', 'w') as f:
    f.write(content)

print("TaskKanbanBoard updated")
