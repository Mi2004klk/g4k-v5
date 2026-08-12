const fs = require('fs');
const glob = require('glob');

function processSelects(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // Example regex for simple native selects
  // This is highly simplified and will need to be robust. 
  // We'll just print out the selects we find first to see if we can easily Regex them.
  const selectRegex = /<select([\s\S]*?)>([\s\S]*?)<\/select>/g;
  
  let match;
  while ((match = selectRegex.exec(content)) !== null) {
    console.log(`\n--- FOUND SELECT IN ${filePath} ---`);
    console.log(match[0]);
  }
}

const files = [
  'src/components/tasks/qa-form-builder.tsx',
  'src/components/reports/saved-report-views.tsx',
  'src/components/attendance/admin-open-shifts-table.tsx',
  'src/app/dashboard/tasks/page.tsx',
  'src/app/dashboard/projects/[id]/page.tsx',
  'src/app/dashboard/projects/page.tsx',
  'src/app/dashboard/profile/page.tsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    processSelects(f);
  } else {
    console.log(`File not found: ${f}`);
  }
});
