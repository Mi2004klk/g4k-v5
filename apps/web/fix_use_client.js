const fs = require('fs');
const files = [
  'src/components/dashboard/employee-task-progress-widget.tsx',
  'src/components/dashboard/hr-team-attendance-widget.tsx',
  'src/components/dashboard/team-attendance-widget.tsx',
  'src/components/widgets/announcement-board.tsx',
  'src/components/widgets/quick-notes.tsx',
  'src/components/widgets/time-clock-widget.tsx',
  'src/components/widgets/upcoming-holidays-widget.tsx',
  'src/components/dashboard/employee-approval-status-widget.tsx',
  'src/components/attendance/hr-activity-feed-widget.tsx'
];
files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('"use client"') && !content.startsWith('"use client"')) {
      content = content.replace(/"use client";?\s*/g, '');
      content = '"use client";\n' + content;
      fs.writeFileSync(file, content);
      console.log('Fixed', file);
    }
  }
});
