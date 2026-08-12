const fs = require('fs');
const path = require('path');

const targetFiles = [
    'apps/web/src/app/dashboard/profile/page.tsx',
    'apps/web/src/app/(auth)/login/page.tsx',
    'apps/web/src/app/(auth)/register/page.tsx',
    'apps/web/src/app/(auth)/reset-password/page.tsx',
    'apps/web/src/components/attendance/hr-attendance-graph.tsx',
    'apps/web/src/components/attendance/hr-attendance-table.tsx',
    'apps/web/src/components/dashboard/team-attendance-widget.tsx',
    'apps/web/src/components/dashboard/hr-team-attendance-widget.tsx',
    'apps/web/src/components/attendance/admin-open-shifts-table.tsx'
];

targetFiles.forEach(file => {
    let p = path.join(__dirname, file);
    if (!fs.existsSync(p)) return;
    let content = fs.readFileSync(p, 'utf8');
    let original = content;

    // Backgrounds
    content = content.replace(/\bbg-white\s+dark:bg-neutral-\d+\b/g, 'bg-card');
    content = content.replace(/\bdark:bg-neutral-\d+\s+bg-white\b/g, 'bg-card');
    content = content.replace(/\bbg-white\b(?!\/)/g, 'bg-card');
    
    // other bg-neutral bypasses
    content = content.replace(/\bbg-neutral-[15]0\s+dark:bg-neutral-[89]00\b/g, 'bg-muted');
    content = content.replace(/\bbg-neutral-[12]00\s+dark:bg-neutral-[87]00\b/g, 'bg-secondary');
    
    // Text bypasses
    content = content.replace(/\btext-neutral-900\s+dark:text-white\b/g, 'text-foreground');
    content = content.replace(/\btext-neutral-900\s+dark:text-neutral-100\b/g, 'text-foreground');
    content = content.replace(/\btext-neutral-800\s+dark:text-neutral-200\b/g, 'text-foreground');
    content = content.replace(/\btext-neutral-[56]00\s+dark:text-neutral-[43]00\b/g, 'text-muted-foreground');
    content = content.replace(/\btext-neutral-[45]00\s+dark:text-neutral-[45]00\b/g, 'text-muted-foreground');
    content = content.replace(/\btext-neutral-[456]00\b/g, 'text-muted-foreground');
    
    // Border bypasses
    content = content.replace(/\bborder-neutral-[23]00\s+dark:border-neutral-[78]00\b/g, 'border-border');
    content = content.replace(/\bborder-neutral-[123]00\b/g, 'border-border');

    // Shadow
    content = content.replace(/\bshadow-sm\b/g, 'shadow-e1');
    content = content.replace(/\bshadow-md\b/g, 'shadow-e2');

    // Radii
    content = content.replace(/\brounded-2xl\b/g, 'rounded-xl');
    
    // Clean up spaces that might have been left behind when we replaced 2 words with 1
    // e.g. "bg-card text-foreground"
    content = content.replace(/class(?:Name)?="([^"]+)"/g, (match, classes) => {
        return match.replace(classes, classes.replace(/\s+/g, ' ').trim());
    });

    if (original !== content) {
        fs.writeFileSync(p, content, 'utf8');
        console.log(`Modified ${file}`);
    }
});
