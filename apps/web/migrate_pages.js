const fs = require('fs');

function convertPage(filePath, title, description) {
  let code = fs.readFileSync(filePath, 'utf8');
  if (code.includes('<PageContainer')) {
    console.log('Skipping', filePath, 'already converted');
    return;
  }
  
  const lastReturnIdx = code.lastIndexOf('return (');
  if (lastReturnIdx === -1) return;
  
  const afterReturn = code.substring(lastReturnIdx);
  
  let headerMatch = afterReturn.match(/return\s*\(\s*<div[^>]*>\s*<div[^>]*>[\s\S]*?<h1[^>]*>[\s\S]*?<\/h1>[\s\S]*?(?:<p[^>]*>[\s\S]*?<\/p>)?[\s\S]*?<\/div>([\s\S]*?)<\/div>\s*/);
  
  if (!headerMatch) {
     console.log('Regex failed for', filePath);
     return;
  }
  
  let actionsMatch = headerMatch[1].match(/<div[^>]*>([\s\S]*)/);
  let actionsStr = actionsMatch ? actionsMatch[0] : '';
  
  let replacement = 'return (\n    <PageContainer\n      title=\"' + title + '\"\n      description=\"' + description + '\"\n';
  if (actionsStr.trim()) {
     replacement += '      actions={\n        ' + actionsStr.trim() + '\n      }\n';
  }
  replacement += '    >\n';
  
  code = code.replace(headerMatch[0], replacement);
  
  const lastDivIdx = code.lastIndexOf('</div>');
  code = code.substring(0, lastDivIdx) + '</PageContainer>' + code.substring(lastDivIdx + 6);
  
  if (!code.includes('PageContainer')) {
    code = 'import { PageContainer } from "@/components/layout/page-container";\n' + code;
  }
  
  fs.writeFileSync(filePath, code);
  console.log('Converted', filePath);
}

convertPage('src/app/dashboard/org/designations/page.tsx', 'Designations', 'Manage job titles and designations used across the organization.');
convertPage('src/app/dashboard/org/leave/page.tsx', 'Leave Approvals', 'Review and manage team time off requests.');
convertPage('src/app/dashboard/org/users/page.tsx', 'Employee Directory', 'Manage organization users, roles, and master data.');
