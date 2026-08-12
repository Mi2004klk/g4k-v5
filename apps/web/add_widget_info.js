const fs = require('fs');
const path = require('path');

function addWidgetInfo(filePath, summary) {
  let code = fs.readFileSync(filePath, 'utf8');
  if (code.includes('WidgetInfo')) return;

  // Add import
  if (code.includes('@/components/widgets/widget-info')) {
     // Already imported somehow
  } else if (filePath.includes('src\\\\components\\\\widgets\\\\') || filePath.includes('src/components/widgets/')) {
     code = 'import { WidgetInfo } from "./widget-info";\n' + code;
  } else {
     code = 'import { WidgetInfo } from "@/components/widgets/widget-info";\n' + code;
  }

  // Insert WidgetInfo after CardTitle
  // Most widgets have: <CardTitle>Something</CardTitle>
  code = code.replace(/(<CardTitle[^>]*>.*?<\/CardTitle>)/, `$1\n        <WidgetInfo summary="${summary}" />`);
  // If it doesn't have CardTitle but has something else... we will rely on CardTitle.
  
  fs.writeFileSync(filePath, code);
}

const widgets = [
  { file: 'src/components/widgets/announcement-board.tsx', summary: 'Recent company announcements and news' },
  { file: 'src/components/widgets/feedback-form.tsx', summary: 'Submit feedback and suggestions' },
  { file: 'src/components/widgets/quick-notes.tsx', summary: 'Your personal scratchpad' },
  { file: 'src/components/widgets/time-clock-widget.tsx', summary: 'Clock in and out of your shifts' },
  { file: 'src/components/widgets/upcoming-holidays-widget.tsx', summary: 'Upcoming corporate holidays' },
  { file: 'src/components/dashboard/employee-approval-status-widget.tsx', summary: 'Track your pending requests' },
  { file: 'src/components/dashboard/employee-task-progress-widget.tsx', summary: 'Your active tasks and deadlines' },
  { file: 'src/components/dashboard/hr-team-attendance-widget.tsx', summary: 'Team attendance overview' },
  { file: 'src/components/dashboard/team-attendance-widget.tsx', summary: 'See who is online in your team' },
  { file: 'src/components/attendance/hr-activity-feed-widget.tsx', summary: 'Live feed of clock ins and outs' },
  { file: 'src/components/dashboard/admin-today-attendance-widget.tsx', summary: 'Company-wide attendance status' },
  { file: 'src/components/dashboard/quick-task-widget.tsx', summary: 'Create tasks quickly' }
];

widgets.forEach(w => {
  try {
    const fullPath = path.join(__dirname, w.file);
    if (fs.existsSync(fullPath)) {
      addWidgetInfo(fullPath, w.summary);
      console.log('Processed', w.file);
    }
  } catch (e) {
    console.error('Failed', w.file, e.message);
  }
});
