const fs = require('fs');

let code = fs.readFileSync('apps/web/src/app/dashboard/directory/page.tsx', 'utf8');

// ORG-1: Fix API route
code = code.replace(/apiFetch\(\`\/directory\/users\?\$\{params\.toString\(\)\}\`\)/g, 'apiFetch(`/directory?${params.toString()}`)');

// ORG-2: Fix Chat direct route
code = code.replace(/apiFetch\(\"\/chat\/direct\"/g, 'apiFetch("/conversations/dm"');
code = code.replace(/body: JSON\.stringify\(\{ user_id: recipientId \}\)/g, 'body: JSON.stringify({ recipient_id: recipientId })');

// ORG-3: Fix Redirect query param
code = code.replace(/router\.push\(\`\/dashboard\/chat\?c=\$\{conversation\.id\}\`\)/g, 'router.push(`/dashboard/chat?conversation=${conversation.conversation_id || conversation.id}`)');
// The backend `startDirectMessage` (or `sendMessage` on directory) returns `conversation_id`.

fs.writeFileSync('apps/web/src/app/dashboard/directory/page.tsx', code);
console.log('Patched directory/page.tsx for ORG-1, ORG-2, ORG-3');
