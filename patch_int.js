const fs = require('fs');

// Patch apps/api/.env.example
let envCode = fs.readFileSync('apps/api/.env.example', 'utf8');

const mailVars = `
MAIL_MAILER=log
MAIL_HOST=127.0.0.1
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="\${APP_NAME}"
`;

if (!envCode.includes('MAIL_MAILER=')) {
    envCode += "\n" + mailVars;
}

if (!envCode.includes('FILESYSTEM_DISK=')) {
    envCode = envCode.replace(
        'BROADCAST_CONNECTION=reverb',
        "FILESYSTEM_DISK=local\nBROADCAST_CONNECTION=reverb"
    );
}

fs.writeFileSync('apps/api/.env.example', envCode);

// Patch apps/api/config/reverb.php
let reverbCode = fs.readFileSync('apps/api/config/reverb.php', 'utf8');
reverbCode = reverbCode.replace(
    /'allowed_origins' => \['\*'\],/g,
    `'allowed_origins' => env('REVERB_ALLOWED_ORIGINS') ? explode(',', env('REVERB_ALLOWED_ORIGINS')) : ['*'],`
);
fs.writeFileSync('apps/api/config/reverb.php', reverbCode);

console.log('Patched .env.example and reverb.php');
