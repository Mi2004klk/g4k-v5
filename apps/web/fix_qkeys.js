const fs = require('fs');

// 1. Revert query-keys.ts
let qkFile = 'src/lib/query-keys.ts';
if (fs.existsSync(qkFile)) {
  let qkContent = fs.readFileSync(qkFile, 'utf8');
  qkContent = qkContent.replace(/settings: \(category\?: string\) => \["settings", category \?\? "all"\] as const,\n/, '');
  fs.writeFileSync(qkFile, qkContent);
}

// 2. Fix notifications-config.tsx
let notifFile = 'src/components/settings/notifications-config.tsx';
if (fs.existsSync(notifFile)) {
  let notifContent = fs.readFileSync(notifFile, 'utf8');
  notifContent = notifContent.replace(/queryKeys\.settings\("notifications"\)/g, '[...queryKeys.settings, "notifications"]');
  fs.writeFileSync(notifFile, notifContent);
}

console.log('Fixed query keys and notifications config');
