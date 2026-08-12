const fs = require('fs');
const path = require('path');

const pages = [
  'src/app/dashboard/admin/attendance/page.tsx',
  'src/app/dashboard/admin/reports/page.tsx',
  'src/app/dashboard/attendance/page.tsx',
  'src/app/dashboard/audit/page.tsx',
  'src/app/dashboard/chat/page.tsx',
  'src/app/dashboard/org/attendance/page.tsx',
  'src/app/dashboard/org/departments/page.tsx',
  'src/app/dashboard/org/designations/page.tsx',
  'src/app/dashboard/org/leave/page.tsx',
  'src/app/dashboard/org/users/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/dashboard/profile/page.tsx',
  'src/app/dashboard/projects/[id]/page.tsx',
  'src/app/dashboard/reports/page.tsx',
  'src/app/dashboard/settings/page.tsx'
];

function transformPage(p) {
  const f = path.join(__dirname, p);
  if (!fs.existsSync(f)) return;
  let code = fs.readFileSync(f, 'utf8');
  if (code.includes('PageContainer')) return;
  
  let headerRegex = /(?:<div className="[^"]*">|<div className='[^']*'>)?\s*<div(?: className="[^"]*")?>\s*<h1[^>]*>([\s\S]*?)<\/h1>\s*(?:<p[^>]*>([\s\S]*?)<\/p>)?\s*<\/div>/;
  
  let match = code.match(headerRegex);
  
  if (!match) {
     console.log('Skipping', p, 'no header match');
     return;
  }
  
  let titleContent = match[1].trim();
  // If title has icons, we just strip them out for the PageContainer title, or leave them. Wait, PageContainer title is a string.
  // Actually, we can just strip out any <svg> or <Icon> tags.
  let titleStr = titleContent.replace(/<[^>]+>/g, '').trim();
  
  let descContent = match[2] ? match[2].trim() : '';
  let descStr = descContent.replace(/<[^>]+>/g, '').trim();
  
  // Now we need to replace the entire return block's outer <div> with <PageContainer>
  let returnIdx = code.indexOf('return (');
  if (returnIdx === -1) returnIdx = code.indexOf('return(');
  if (returnIdx === -1) return;
  
  let afterReturn = code.slice(returnIdx);
  // Match the first <div ...>
  let firstDivMatch = afterReturn.match(/<div[^>]*>/);
  if (!firstDivMatch) return;
  
  // Replace the first div with <PageContainer title="..." description="...">
  // AND we must remove the header block from the inside!
  
  // Let's use a simple approach:
  // 1. Add import PageContainer
  if (!code.includes('import { PageContainer }')) {
    code = 'import { PageContainer } from "@/components/layout/page-container";\n' + code;
  }
  
  // 2. We can manually edit these files since they are slightly different,
  // but let's try a regex for the most common pattern:
  let pattern1 = /return\s*\(\s*<div[^>]*>\s*<div[^>]*>\s*<h1[^>]*>[\s\S]*?<\/h1>\s*(?:<p[^>]*>[\s\S]*?<\/p>)?\s*<\/div>/;
  if (code.match(pattern1)) {
     code = code.replace(pattern1, `return (\n    <PageContainer title="${titleStr}" description="${descStr}">`);
     // Replace the last </div> with </PageContainer>
     let lastDivIdx = code.lastIndexOf('</div>');
     if (lastDivIdx !== -1) {
       code = code.substring(0, lastDivIdx) + '</PageContainer>' + code.substring(lastDivIdx + 6);
     }
     fs.writeFileSync(f, code);
     console.log('Transformed', p);
  } else {
     console.log('Skipping', p, 'pattern mismatch');
  }
}

pages.forEach(transformPage);
