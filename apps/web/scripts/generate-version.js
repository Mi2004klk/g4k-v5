const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Generate a random build ID (or use COMMIT_SHA from CI)
const buildId = process.env.GITHUB_SHA || crypto.randomBytes(8).toString('hex');
const versionData = { version: buildId, timestamp: new Date().toISOString() };

const pubDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(pubDir)) {
  fs.mkdirSync(pubDir, { recursive: true });
}

fs.writeFileSync(
  path.join(pubDir, 'version.json'),
  JSON.stringify(versionData, null, 2)
);

console.log(`Generated version.json with buildId: ${buildId}`);
