const fs = require('fs');

function addSheetDescription(filePath, searchString, descriptionTag) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('SheetDescription')) {
        // add import
        content = content.replace(/import\s+{([^}]+)}\s+from\s+["']@g4k\/ui\/components["'];/, (match, p1) => {
            if (p1.includes('SheetDescription')) return match;
            return `import { SheetDescription, ${p1.trim()} } from "@g4k/ui/components";`;
        });
    }
    content = content.replace(searchString, `${searchString}\n${descriptionTag}`);
    fs.writeFileSync(filePath, content);
}

// 1. task-detail-sheet.tsx
addSheetDescription(
    'apps/web/src/components/tasks/task-detail-sheet.tsx',
    '<SheetTitle className="text-base font-bold mt-2">{task.title}</SheetTitle>',
    '          <SheetDescription className="sr-only">Detailed view and management of the selected task.</SheetDescription>'
);

// 2. saved-report-views.tsx
addSheetDescription(
    'apps/web/src/components/reports/saved-report-views.tsx',
    '<SheetTitle className="text-sm font-semibold">Saved Reports</SheetTitle>',
    '              <SheetDescription className="sr-only">List of your saved report views.</SheetDescription>'
);

// 3. layout.tsx
addSheetDescription(
    'apps/web/src/app/dashboard/layout.tsx',
    '<SheetTitle className="sr-only">Navigation Menu</SheetTitle>',
    '                    <SheetDescription className="sr-only">Main navigation menu for the dashboard.</SheetDescription>'
);

console.log('Added SheetDescription to all 3 files.');
