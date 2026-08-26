"use client";

import Link from "next/link";
import { Button } from "@g4k/ui/components";
import { AppIcon } from "@g4k/ui/components";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-app gap-6 p-4 text-center">
      <div className="bg-primary-50 dark:bg-primary-900/30 p-6 rounded-full shadow-inner border border-primary-100 dark:border-primary-800/50 text-primary-600 dark:text-primary-400">
        <AppIcon name="search" size="hero" className="w-16 h-16" />
      </div>
      
      <div className="space-y-2 max-w-md">
        <h1 className="text-3xl font-display font-bold text-neutral-900 dark:text-white tracking-tight">
          Page Not Found
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
      </div>

      <div className="pt-4">
        <Button asChild className="gap-2 font-semibold shadow-sm h-11 px-8 rounded-full">
          <Link href="/dashboard" prefetch={false}>
            <AppIcon name="dashboard" size="sm" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
