const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const standardClass = "border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150 rounded-xl overflow-hidden h-full";

walkDir('apps/web/src/components', (filePath) => {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Remove border-none, add border border-neutral-200 dark:border-neutral-800
    content = content.replace(/className="([^"]*)border-none([^"]*)"/g, (match, p1, p2) => {
      let classes = (p1 + p2).trim().split(/\s+/).filter(Boolean);
      // Remove other border related stuff just in case
      classes = classes.filter(c => !c.startsWith('rounded-') && !c.startsWith('shadow-') && c !== 'border' && c !== 'border-neutral-200' && c !== 'dark:border-neutral-800');
      
      // Add standard
      return `className="${classes.join(' ')} ${standardClass}"`;
    });

    // Fix shadow-sm to standard shadow
    content = content.replace(/className="([^"]*)shadow-sm([^"]*)"/g, (match, p1, p2) => {
       let classes = (p1 + p2).trim().split(/\s+/).filter(Boolean);
       if (!classes.includes('shadow-e1')) {
           classes.push('shadow-e1', 'hover:shadow-e2', 'transition-shadow', 'duration-150');
       }
       return `className="${classes.join(' ')}"`;
    });

    // Fix rounded-2xl to rounded-xl
    content = content.replace(/rounded-2xl/g, 'rounded-xl');

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${filePath}`);
    }
  }
});
