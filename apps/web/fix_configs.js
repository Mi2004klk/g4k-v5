const fs = require('fs');
const files = [
  'src/components/settings/mail-smtp-config.tsx',
  'src/components/settings/policies-config.tsx',
  'src/components/settings/reminders-config.tsx'
];
files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/queryKeys\.settings\("([^"]+)"\)/g, '[...queryKeys.settings, "$1"]');
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
});
