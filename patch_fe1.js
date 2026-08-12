const fs = require('fs');

function replaceFetch(filePath, fetchPattern, apiFetchReplacement) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Ensure apiFetch is imported
  if (!content.includes('apiFetch')) {
      if (content.includes('@/lib/api-client')) {
          content = content.replace(/import\s+{([^}]+)}\s+from\s+["']@\/lib\/api-client["'];/, (match, p1) => {
              if (p1.includes('apiFetch')) return match;
              return `import { apiFetch, ${p1.trim()} } from "@/lib/api-client";`;
          });
      } else {
          content = `import { apiFetch } from "@/lib/api-client";\n` + content;
      }
  }
  content = content.replace(fetchPattern, apiFetchReplacement);
  fs.writeFileSync(filePath, content);
}

// 1. hr-attendance-table.tsx
replaceFetch(
    'apps/web/src/components/attendance/hr-attendance-table.tsx',
    /await fetch\(`\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:8000\/api'\}\/attendance\/export\?\$\{params\.toString\(\)\}`, \{\s*headers: \{\s*Authorization: `Bearer \$\{token\}`,\s*\},\s*\}\)/g,
    `await apiFetch(\`/attendance/export?\${params.toString()}\`)`
);

// 2. admin-attendance-table.tsx
replaceFetch(
    'apps/web/src/components/attendance/admin-attendance-table.tsx',
    /await fetch\(`\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:8000\/api'\}\/attendance\/export\?\$\{params\.toString\(\)\}`, \{\s*headers: \{\s*Authorization: `Bearer \$\{token\}`,\s*\},\s*\}\)/g,
    `await apiFetch(\`/attendance/export?\${params.toString()}\`)`
);

// 3. org/leave/page.tsx
replaceFetch(
    'apps/web/src/app/dashboard/org/leave/page.tsx',
    /const response = await fetch\(url, \{\s*headers: \{\s*Authorization: `Bearer \$\{token\}`,\s*\},\s*\}\);/g,
    `const response = await apiFetch(\`/leave/export?\${params.toString()}\`);`
);

// 4. designations/page.tsx
replaceFetch(
    'apps/web/src/app/dashboard/org/designations/page.tsx',
    /await fetch\(`\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:8000\/api'\}\/designations\/export\?\$\{params\.toString\(\)\}`, \{\s*headers: \{\s*Authorization: `Bearer \$\{token\}`,\s*\},\s*\}\)/g,
    `await apiFetch(\`/designations/export?\${params.toString()}\`)`
);

// 5. departments/page.tsx
replaceFetch(
    'apps/web/src/app/dashboard/org/departments/page.tsx',
    /await fetch\(`\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:8000\/api'\}\/departments\/export\?\$\{params\.toString\(\)\}`, \{\s*headers: \{\s*Authorization: `Bearer \$\{token\}`,\s*\},\s*\}\)/g,
    `await apiFetch(\`/departments/export?\${params.toString()}\`)`
);

// 6. settings-tabs.tsx
replaceFetch(
    'apps/web/src/components/settings/settings-tabs.tsx',
    /await fetch\(`\$\{process\.env\.NEXT_PUBLIC_API_URL\}\/api\/company-profile\/logo`, \{\s*method: "POST",\s*headers: \{\s*Authorization: `Bearer \$\{token\}`,\s*\},\s*body: formData,\s*\}\)/g,
    `await apiFetch(\`/company-profile/logo\`, { method: "POST", body: formData })`
);

console.log('Replaced fetch in all files.');
