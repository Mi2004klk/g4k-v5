const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const MAX_ROUTE_CHUNK_GZ_KB = 350;
const MAX_FIRST_LOAD_GZ_KB = 200; // Note: Next.js first load includes framework chunks + route chunks.

function getGzippedSize(filePath) {
  const content = fs.readFileSync(filePath);
  const gzipped = zlib.gzipSync(content);
  return gzipped.length / 1024; // KB
}

function scanDirectory(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDirectory(fullPath, fileList);
    } else if (fullPath.endsWith('.js')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const chunksDir = path.join(__dirname, '../.next/static/chunks');
const appChunksDir = path.join(chunksDir, 'app');

let hasError = false;

if (fs.existsSync(appChunksDir)) {
  const routeChunks = scanDirectory(appChunksDir);
  routeChunks.forEach(chunkPath => {
    const size = getGzippedSize(chunkPath);
    const relativePath = path.relative(appChunksDir, chunkPath);
    
    if (size > MAX_ROUTE_CHUNK_GZ_KB) {
      console.error(`❌ [BUDGET BREACH] Route Chunk: ${relativePath} is ${size.toFixed(2)} KB gz (Limit: ${MAX_ROUTE_CHUNK_GZ_KB} KB)`);
      hasError = true;
    } else {
      console.log(`✅ Route Chunk: ${relativePath} is ${size.toFixed(2)} KB gz`);
    }
  });
} else {
  console.log("No /app chunks found. Assuming build was clean.");
}

let frameworkSize = 0;
let mainSize = 0;

if (fs.existsSync(chunksDir)) {
  const rootChunks = fs.readdirSync(chunksDir);
  rootChunks.forEach(file => {
    if (file.startsWith('framework-') && file.endsWith('.js')) {
      frameworkSize += getGzippedSize(path.join(chunksDir, file));
    }
    if (file.startsWith('main-') && file.endsWith('.js')) {
      mainSize += getGzippedSize(path.join(chunksDir, file));
    }
  });
  
  const baseFirstLoad = frameworkSize + mainSize;
  console.log(`Base First-Load (Framework + Main): ${baseFirstLoad.toFixed(2)} KB gz`);
  
  // Note: strict check for 200KB might be hard depending on UI libraries, we'll flag it.
  if (baseFirstLoad > MAX_FIRST_LOAD_GZ_KB) {
     console.error(`❌ [BUDGET BREACH] Base First-Load JS is ${baseFirstLoad.toFixed(2)} KB gz (Limit: ${MAX_FIRST_LOAD_GZ_KB} KB)`);
     hasError = true;
  }
}

if (hasError) {
  process.exit(1);
} else {
  console.log("✅ All bundle size budgets passed!");
}
