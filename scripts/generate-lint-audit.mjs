import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('Reading ESLint JSON output...');
let results = [];
try {
  const jsonStr = readFileSync(path.join(rootDir, 'apps', 'web', 'web_lint.json'), 'utf-8');
  results = JSON.parse(jsonStr);
} catch (parseError) {
  console.error('Error parsing JSON from ESLint output:', parseError);
  process.exit(1);
}

console.log(`Found ${results.length} files checked by ESLint.`);

const grouped = {};
let totalErrors = 0;
let totalWarnings = 0;

for (const result of results) {
  if (result.errorCount === 0 && result.warningCount === 0) continue;
  
  totalErrors += result.errorCount;
  totalWarnings += result.warningCount;

  const relativePath = path.relative(rootDir, result.filePath).replace(/\\/g, '/');
  
  let groupKey = 'Root';
  if (relativePath.startsWith('apps/')) {
    const parts = relativePath.split('/');
    if (parts.length >= 2) groupKey = `apps/${parts[1]}`;
  } else if (relativePath.startsWith('packages/')) {
    const parts = relativePath.split('/');
    if (parts.length >= 2) groupKey = `packages/${parts[1]}`;
  }

  if (!grouped[groupKey]) {
    grouped[groupKey] = [];
  }
  
  grouped[groupKey].push({
    filePath: relativePath,
    fullPath: result.filePath,
    messages: result.messages,
    errorCount: result.errorCount,
    warningCount: result.warningCount
  });
}

console.log(`Total Problems: ${totalErrors} errors, ${totalWarnings} warnings`);

let mdContent = `# Lint Audit Report\n\n`;
mdContent += `**Total Errors:** ${totalErrors}  \n`;
mdContent += `**Total Warnings:** ${totalWarnings}  \n\n`;
mdContent += `> Note: This is an automatically generated audit report of all lint errors and warnings across the monorepo.\n\n`;

const groupKeys = Object.keys(grouped).sort();

for (const key of groupKeys) {
  mdContent += `## ${key}\n\n`;
  
  const files = grouped[key].sort((a, b) => a.filePath.localeCompare(b.filePath));
  
  for (const file of files) {
    const absoluteUri = `file:///${file.fullPath.replace(/\\/g, '/')}`;
    
    mdContent += `### [${file.filePath}](${absoluteUri})\n`;
    mdContent += `*${file.errorCount} error(s), ${file.warningCount} warning(s)*\n\n`;
    
    mdContent += `| Line | Severity | Rule | Message |\n`;
    mdContent += `| :--- | :--- | :--- | :--- |\n`;
    
    for (const msg of file.messages) {
      const severity = msg.severity === 2 ? '🔴 Error' : '🟡 Warning';
      const lineStr = msg.line ? `Line ${msg.line}:${msg.column}` : 'N/A';
      const link = msg.line ? `[${lineStr}](${absoluteUri}#L${msg.line})` : lineStr;
      const text = (msg.message || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
      const ruleId = msg.ruleId || 'N/A';
      
      mdContent += `| ${link} | ${severity} | \`${ruleId}\` | ${text} |\n`;
    }
    mdContent += `\n`;
  }
}

const outputPath = path.join(rootDir, 'lint.md');
writeFileSync(outputPath, mdContent);
console.log(`Audit report written to ${outputPath}`);
