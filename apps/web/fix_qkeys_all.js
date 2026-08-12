const fs = require('fs');
const path = require('path');

const dir = 'src/components/settings';
if (fs.existsSync(dir)) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    if (file.endsWith('.tsx')) {
      let filePath = path.join(dir, file);
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('queryKeys.settings(')) {
        content = content.replace(/queryKeys\.settings\("([^"]+)"\)/g, '[...queryKeys.settings, "$1"]');
        fs.writeFileSync(filePath, content);
        console.log('Fixed settings queryKey in', file);
      }
    }
  });
}
