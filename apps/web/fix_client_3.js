const fs = require('fs');
const files = [
  'src/app/dashboard/org/leave/page.tsx',
  'src/app/(auth)/reset-password/page.tsx',
  'src/hooks/use-url-state.ts'
];
files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('"use client"') && !content.includes("'use client'")) {
      content = '"use client";\n' + content;
      fs.writeFileSync(file, content);
      console.log('Added use client to', file);
    } else {
      // If it exists, make sure it's at the top
      content = content.replace(/"use client";?\s*/g, '');
      content = '"use client";\n' + content;
      fs.writeFileSync(file, content);
      console.log('Fixed use client to', file);
    }
  }
});
