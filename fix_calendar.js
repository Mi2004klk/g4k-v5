const fs = require('fs');
let file = 'packages/ui/src/components/calendar.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/components=\{\{([\s\S]*?)\}\}/, '');
fs.writeFileSync(file, content);
console.log('Fixed calendar');
