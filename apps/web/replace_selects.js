const fs = require('fs');
const path = require('path');

function replaceNativeSelects(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  
  if (!code.includes('<select')) return;

  // Add imports if they don't exist
  if (!code.includes('SelectContent')) {
    if (code.includes('import {') && code.includes('@g4k/ui/components')) {
      code = code.replace(/import {([^}]+)} from \"@g4k\/ui\/components\";/, 'import { $1, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from \"@g4k/ui/components\";');
    } else {
      code = 'import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from \"@g4k/ui/components\";\n' + code;
    }
  }

  // Find all <select> tags and replace them with <Select>
  // This is a simple regex that assumes standard formatting. It might not catch all edge cases but handles most.
  code = code.replace(/<select([^>]*)>(.*?)<\/select>/gs, (match, attrs, content) => {
    // Extract value and onChange
    let valueMatch = attrs.match(/value={([^}]+)}/);
    let onChangeMatch = attrs.match(/onChange={([^}]+)}/);
    let classNameMatch = attrs.match(/className=\"([^\"]+)\"/);
    
    // We try to handle {...form.register('...')} cases in react-hook-form
    if (attrs.includes('...form.register') || attrs.includes('...register')) {
       // Cannot easily replace uncontrolled react-hook-form selects with primitive select without Controller.
       // Skip these for now.
       return match;
    }

    let valueStr = valueMatch ? valueMatch[1] : 'undefined';
    
    // For onChange we need to adapt `(e) => setX(e.target.value)` to `setX` or `(val) => setX(val)`
    let onValueChangeStr = 'undefined';
    if (onChangeMatch) {
      let funcBody = onChangeMatch[1];
      if (funcBody.includes('e.target.value')) {
        // e.g. (e) => setX(e.target.value)  -> (val) => setX(val)
        let extractedFunc = funcBody.match(/=>\s*([a-zA-Z0-9_]+)\(e\.target\.value\)/);
        if (extractedFunc) {
          onValueChangeStr = extractedFunc[1];
        } else {
          onValueChangeStr = `(val) => { const e = { target: { value: val } }; (${funcBody})(e as any); }`;
        }
      } else {
        onValueChangeStr = funcBody;
      }
    }

    let items = content.replace(/<option[^>]*value=\"([^\"]*)\"[^>]*>(.*?)<\/option>/gs, '<SelectItem value=\"$1\">$2</SelectItem>');
    items = items.replace(/<option[^>]*value=\{([^}]+)\}[^>]*>(.*?)<\/option>/gs, '<SelectItem value={$1}>$2</SelectItem>');

    // Create a placeholder from the first option if it has empty value
    let placeholder = 'Select...';
    let firstOptionMatch = content.match(/<option[^>]*value=\"\"[^>]*>(.*?)<\/option>/);
    if (firstOptionMatch) {
       placeholder = firstOptionMatch[1];
    }

    return `<Select value={${valueStr}} onValueChange={${onValueChangeStr}}>
      <SelectTrigger className=\"${classNameMatch ? classNameMatch[1] : 'w-full h-9'}\">
        <SelectValue placeholder=\"${placeholder}\" />
      </SelectTrigger>
      <SelectContent>
        ${items}
      </SelectContent>
    </Select>`;
  });

  fs.writeFileSync(filePath, code);
}

const files = [
  'src/components/tasks/qa-form-builder.tsx',
  'src/components/settings/settings-tabs.tsx',
  'src/components/reports/saved-report-views.tsx',
  'src/components/attendance/admin-open-shifts-table.tsx',
  'src/app/dashboard/projects/[id]/page.tsx',
  'src/app/dashboard/projects/page.tsx',
  'src/app/dashboard/profile/page.tsx',
  'src/app/dashboard/admin/reports/page.tsx',
  'src/app/dashboard/tasks/page.tsx'
];

files.forEach(f => {
  try {
    const fullPath = path.join(__dirname, f);
    if (fs.existsSync(fullPath)) {
      replaceNativeSelects(fullPath);
      console.log('Processed', f);
    }
  } catch (e) {
    console.error('Failed', f, e.message);
  }
});
