const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, '../src'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // 1. Remove imports of asArray and unwrapOne
  if (content.includes('asArray') || content.includes('unwrapOne')) {
    const originalContent = content;
    content = content.replace(/import\s+{([^}]*)}\s+from\s+["']@\/lib\/(api-client|utils)["'];/g, (match, imports, source) => {
      let parts = imports.split(',').map(s => s.trim()).filter(s => s !== 'asArray' && s !== 'unwrapOne' && s !== 'unwrapList' && s !== '');
      if (parts.length === 0) return '';
      return `import { ${parts.join(', ')} } from "@/lib/${source}";`;
    });

    if (content !== originalContent) changed = true;

    // Handle single line imports if they were somehow missed or format is slightly different
    if (content.match(/,\s*asArray\b/)) { content = content.replace(/,\s*asArray\b/g, ''); changed = true; }
    if (content.match(/\basArray\s*,\s*/)) { content = content.replace(/\basArray\s*,\s*/g, ''); changed = true; }
    if (content.match(/,\s*unwrapOne\b/)) { content = content.replace(/,\s*unwrapOne\b/g, ''); changed = true; }
    if (content.match(/\bunwrapOne\s*,\s*/)) { content = content.replace(/\bunwrapOne\s*,\s*/g, ''); changed = true; }
  }

  // 2. Replace asArray(X) with (X?.data || X || [])
  if (content.includes('asArray(')) {
    content = content.replace(/asArray\(([^)]+)\)/g, '(Array.isArray($1?.data) ? $1.data : (Array.isArray($1) ? $1 : []))');
    changed = true;
  }
  
  // 3. Replace unwrapOne(X) with (X?.data ?? X)
  if (content.includes('unwrapOne(')) {
    content = content.replace(/unwrapOne\(([^)]+)\)/g, '($1?.data ?? $1)');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
