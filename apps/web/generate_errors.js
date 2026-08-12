const fs = require('fs');
const path = require('path');

function findPageDirs(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  let hasPage = false;
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findPageDirs(fullPath, fileList);
    } else if (file === 'page.tsx') {
      hasPage = true;
    }
  }
  if (hasPage) {
    fileList.push(dir);
  }
  return fileList;
}

const dirs = findPageDirs(path.join(__dirname, 'src/app/dashboard'));
console.log('Found', dirs.length, 'page directories');

const errorContent = `"use client";

import { useEffect } from "react";
import { EmptyState, Button } from "@g4k/ui/components";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[80vh] items-center justify-center p-6">
      <EmptyState
        title="Something went wrong!"
        description={error.message || "An unexpected error occurred while loading this page."}
        action={
          <Button onClick={() => reset()} variant="outline">
            Try again
          </Button>
        }
      />
    </div>
  );
}
`;

let addedCount = 0;
dirs.forEach(dir => {
  const errorFile = path.join(dir, 'error.tsx');
  if (!fs.existsSync(errorFile)) {
    fs.writeFileSync(errorFile, errorContent);
    addedCount++;
  }
});
console.log('Added error.tsx to', addedCount, 'directories');
