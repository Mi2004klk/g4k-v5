"use client";

import { useEffect } from "react";
import { Button } from "@g4k/ui/components";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-6 min-h-[400px]">
      <div className="max-w-md w-full bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-8 text-center shadow-e1 hover:shadow-e2 transition-shadow duration-150">
        <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
          Failed to load attendance dashboard
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
          There was an error loading the company attendance data. Please try again or contact support if the issue persists.
        </p>
        <Button onClick={() => reset()} className="w-full">
          Try again
        </Button>
      </div>
    </div>
  );
}
