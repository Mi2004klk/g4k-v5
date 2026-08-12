const fs = require('fs');
let depCode = fs.readFileSync('DEPLOYMENT.md', 'utf8');

const productionEnv = `
## Required Production Environment Variables (Railway)
When deploying the Laravel API to Railway, ensure the following critical variables are set explicitly in the Railway Variables dashboard:

| Variable | Required Value | Description |
|---|---|---|
| \`BROADCAST_CONNECTION\` | \`reverb\` | Required to boot the WebSocket engine. If null, real-time events will fail silently. |
| \`FILESYSTEM_DISK\` | \`s3\` | Required to pipe binary uploads into Supabase Storage. Ephemeral local disk storage on Railway will be wiped on every deployment. |
| \`MAIL_MAILER\` | \`smtp\` | Required to send actual emails. \`log\` is used locally. |
| \`MAIL_HOST\`, \`MAIL_PORT\`, \`MAIL_USERNAME\`, \`MAIL_PASSWORD\` | *Your SMTP Credentials* | Required for Password Resets & Weekly summaries to function. |
| \`REVERB_ALLOWED_ORIGINS\` | \`https://g4-k-web.vercel.app\` | A comma-separated list of allowed domains for WebSockets to prevent hijacking. |
`;

if (!depCode.includes('Required Production Environment Variables')) {
    depCode += "\n" + productionEnv;
}
fs.writeFileSync('DEPLOYMENT.md', depCode);
console.log('Patched DEPLOYMENT.md');
