import fs from 'fs';
import path from 'path';

const webDir = path.join(process.cwd(), 'src');

const componentsToReplace = [
  'button',
  'input',
  'password-input',
  'textarea',
  'card',
  'label',
  'separator',
  'badge',
  'avatar',
  'progress',
  'popover',
  'command',
  'combobox',
  'empty-state',
  'dialog',
  'alert-dialog',
  'sheet',
  'tooltip',
  'dropdown-menu',
  'context-menu',
  'select',
  'checkbox',
  'switch',
  'radio-group',
  'slider',
  'tabs',
  'accordion',
  'collapsible',
  'scroll-area',
  'form',
  'skeleton',
  'error-boundary',
  'offline-banner',
  'sonner',
  'data-table'
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let updated = false;

      // Match imports like:
      // import { Button } from "@/components/ui/button"
      // import { Card, CardHeader } from "@/components/ui/card"
      // or multi-line imports
      // or relative imports like "./button" (inside components/ui)

      for (const component of componentsToReplace) {
        // match "@/components/ui/component", "../components/ui/component", "../../components/ui/component"
        const regex1 = new RegExp(`import\\s+{([\\s\\S]*?)}\\s+from\\s+['"](?:@|\\.\\.|\\.)\\/.*?components\\/ui\\/${component}['"]`, 'g');
        if (regex1.test(content)) {
          content = content.replace(regex1, (match, imports) => {
            return `import {${imports}} from "@g4k/ui/components"`;
          });
          updated = true;
        }

        // Match relative imports when inside components/ui
        if (fullPath.includes('components\\ui') || fullPath.includes('components/ui')) {
          const regex2 = new RegExp(`import\\s+{([\\s\\S]*?)}\\s+from\\s+['"]\\.\\/${component}['"]`, 'g');
          if (regex2.test(content)) {
            content = content.replace(regex2, (match, imports) => {
              return `import {${imports}} from "@g4k/ui/components"`;
            });
            updated = true;
          }
        }
      }

      if (updated) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated imports in ${fullPath}`);
      }
    }
  }
}

processDirectory(webDir);
console.log('Finished fixing imports');
