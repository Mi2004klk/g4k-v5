const fs = require('fs');
const path = require('path');

const files = [
  "apps/web/src/components/app-shell/notifications-bell.tsx",
  "apps/web/src/components/attendance/admin-attendance-table.tsx",
  "apps/web/src/components/attendance/hr-attendance-table.tsx",
  "apps/web/src/components/attendance/team-member-attendance-sheet.tsx",
  "apps/web/src/components/chat/message-composer.tsx",
  "apps/web/src/components/projects/project-card.tsx",
  "apps/web/src/components/settings/settings-tabs.tsx",
  "apps/web/src/components/leave/holiday-calendar.tsx",
  "apps/web/src/components/tasks/task-kanban-board.tsx",
  "apps/web/src/components/dashboard/quick-notes.tsx",
  "apps/web/src/components/dashboard/announcement-board.tsx",
  "apps/web/src/components/dashboard/time-clock-widget.tsx",
  "apps/web/src/components/leave/leave-approval-actions-cell.tsx",
  "apps/web/src/components/settings/security-requests-config.tsx",
  "apps/web/src/components/dashboard/pending-approvals-widget.tsx"
];

for (let file of files) {
  let fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) continue;
  
  let code = fs.readFileSync(fullPath, 'utf8');
  let originalCode = code;

  // Add imports if needed
  if (code.includes('title=') && !code.includes('TooltipContent')) {
    if (code.includes('import {') && code.includes('@g4k/ui/components')) {
      code = code.replace(/import {([^}]+)} from \"@g4k\/ui\/components\";/, 'import { $1, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from \"@g4k/ui/components\";');
    } else {
      code = 'import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from \"@g4k/ui/components\";\n' + code;
    }
  }

  // Replace <button title="abc"> or <div title="abc"> with Tooltip (Regex is tricky, but let's try a safe approach for buttons)
  // Actually, doing this safely via regex is hard for nested jsx.
}
