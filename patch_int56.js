const fs = require('fs');

// Patch apps/api/.env.example for INT-5
let envCode = fs.readFileSync('apps/api/.env.example', 'utf8');
envCode = envCode.replace('SENTRY_TRACES_SAMPLE_RATE=1.0', 'SENTRY_TRACES_SAMPLE_RATE=0.1');
fs.writeFileSync('apps/api/.env.example', envCode);
console.log('Patched .env.example');

// Patch DEPLOYMENT.md for INT-5 and INT-6
let depCode = fs.readFileSync('DEPLOYMENT.md', 'utf8');

const workersSetup = `
## Background Workers & Cron Scheduling (Railway)
Laravel requires background workers to process jobs (emails, exports, notifications) and a scheduler to run cron jobs (reminders, weekly reports). In Railway, these must run as independent services to avoid blocking the main web server.

### 1. Setup the Queue Worker Service
1. In your Railway project, click **New > GitHub Repo** and select this repository again.
2. Go to the new service's **Settings > Build** and ensure the Root Directory is \`apps/api\`.
3. Go to **Settings > Deploy** and set the **Start Command** to:
   \`\`\`bash
   php artisan queue:work --sleep=3 --tries=3 --max-time=3600
   \`\`\`
4. Copy all environment variables from the main Web service to this Worker service.

### 2. Setup the Cron Scheduler Service
1. In your Railway project, click **New > GitHub Repo** and select this repository again.
2. Go to the new service's **Settings > Build** and ensure the Root Directory is \`apps/api\`.
3. Go to **Settings > Deploy** and set the **Start Command** to:
   \`\`\`bash
   php artisan schedule:work
   \`\`\`
   *(Note: \`schedule:work\` runs locally in the foreground, triggering \`schedule:run\` every minute without needing a system cron daemon).*
4. Copy all environment variables from the main Web service to this Cron service.

## Performance Tuning
| Variable | Recommended Value | Description |
|---|---|---|
| \`SENTRY_TRACES_SAMPLE_RATE\` | \`0.1\` | Set to 10% (0.1) in production to avoid exceeding Sentry quotas and minimize performance overhead. |
`;

if (!depCode.includes('Background Workers & Cron Scheduling')) {
    depCode += "\n" + workersSetup;
}

fs.writeFileSync('DEPLOYMENT.md', depCode);
console.log('Patched DEPLOYMENT.md');
