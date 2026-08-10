"use client";

import { Skeleton } from "@g4k/ui/components";

export default function Loading() {
  return (
    <div className="flex-1 overflow-auto bg-neutral-50 dark:bg-neutral-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="space-y-6">
          <Skeleton className="h-12 w-full rounded-xl" />
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
            <div className="flex gap-4 mb-6">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32 ml-auto" />
              <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
