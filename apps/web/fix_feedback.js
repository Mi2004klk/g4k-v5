const fs = require('fs');
const files = [
  'src/components/widgets/feedback-form.tsx'
];
files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('"use client"') && !content.startsWith('"use client"')) {
      content = content.replace(/"use client";?\s*/g, '');
      content = '"use client";\n' + content;
      fs.writeFileSync(file, content);
      console.log('Fixed', file);
    }
  }
});
