import { Skeleton } from "@g4k/ui/components";

export default function Loading() {
  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      <div className="w-80 border-r border-neutral-200 dark:border-neutral-800 p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
      <div className="flex-1 flex flex-col p-4 space-y-4">
        <Skeleton className="h-16 w-full" />
        <div className="flex-1" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
