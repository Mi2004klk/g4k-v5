const fs = require('fs');
const path = require('path');
function processDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let code = fs.readFileSync(fullPath, 'utf8');
            let newCode = code.replace(/\{\s*label:\s*["'][^"']+["'],\s*value:\s*["']all["']\s*\},?\s*/g, '');
            if (code !== newCode) {
                fs.writeFileSync(fullPath, newCode);
                console.log('Processed', fullPath);
            }
        }
    });
}
processDir('apps/web/src/app');
processDir('apps/web/src/components');
