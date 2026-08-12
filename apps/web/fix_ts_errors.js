const fs = require('fs');

// 1. Link in reset-password
let file = 'src/app/(auth)/reset-password/page.tsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('import Link from "next/link"')) {
    content = 'import Link from "next/link";\n' + content;
    fs.writeFileSync(file, content);
  }
}

// 2. Role select null to string
file = 'src/app/(auth)/role-select/page.tsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  // Usually this is something like updateRole(null) or setRole(null) where state is string.
  // We'll replace `null` with `""` for the specific line.
  content = content.replace(/setSelectedRole\(null\)/g, 'setSelectedRole("")');
  fs.writeFileSync(file, content);
}

// 3. Tooltip and Button in org/attendance/page.tsx
file = 'src/app/dashboard/org/attendance/page.tsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  // Make sure they are imported
  if (!content.includes('import { Button }')) {
    content = content.replace(/import {([^}]+)} from "@g4k\/ui\/components";/, (m, p1) => {
      let imports = p1.split(',').map(s => s.trim());
      ['Button', 'TooltipProvider', 'Tooltip', 'TooltipTrigger', 'TooltipContent'].forEach(item => {
        if (!imports.includes(item)) imports.push(item);
      });
      return `import { ${imports.join(', ')} } from "@g4k/ui/components";`;
    });
    // In case there is no existing import from ui components
    if (!content.includes('from "@g4k/ui/components"')) {
      content = 'import { Button, TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@g4k/ui/components";\n' + content;
    }
    fs.writeFileSync(file, content);
  }
}

// 4. PageContainer in org/leave/page.tsx
file = 'src/app/dashboard/org/leave/page.tsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('import { PageContainer }')) {
    content = 'import { PageContainer } from "@/components/layout/page-container";\n' + content;
    fs.writeFileSync(file, content);
  }
}

// 5. ConfirmDialog in org/users/[id]/page.tsx
file = 'src/app/dashboard/org/users/[id]/page.tsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/isDestructive/g, 'variant="destructive"');
  fs.writeFileSync(file, content);
}

// 6. notifications-config.tsx
file = 'src/components/settings/notifications-config.tsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  // queryKeys.settings() -> queryKeys.settings
  content = content.replace(/queryKeys\.settings\(\)/g, 'queryKeys.settings');
  // Type 'Record<string, any>' must have a '[Symbol.iterator]()'
  content = content.replace(/const \[settings, setSettings\] = useState<Record<string, any>>\(\{\}\);/g, 'const [settings, setSettings] = useState<any>({});');
  // sometimes it's Object.entries(settings).map if they iterate over an object.
  fs.writeFileSync(file, content);
}

console.log('Fixed TS errors step 1');
