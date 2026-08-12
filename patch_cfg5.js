const fs = require('fs');

let code = fs.readFileSync('apps/web/src/components/settings/policies-config.tsx', 'utf8');

const searchStr = `<CardDescription className="text-xs text-neutral-500 font-sans">
                Configure how long user sessions remain active before requiring re-authentication.
              </CardDescription>`;

const replaceStr = `<CardDescription className="text-xs text-neutral-500 font-sans">
                Configure how long user sessions remain active before requiring re-authentication.
                <br /><span className="text-brand-violet">Note: Changes to these limits will apply to all new logins. Existing sessions will keep their original expiry.</span>
              </CardDescription>`;

code = code.replace(searchStr, replaceStr);

fs.writeFileSync('apps/web/src/components/settings/policies-config.tsx', code);
console.log('Patched policies-config.tsx for CFG-5');
