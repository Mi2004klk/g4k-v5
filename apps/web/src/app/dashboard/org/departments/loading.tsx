import { Skeleton } from "@g4k/ui/components";

export default function Loading() {
  return (
    <div className="p-8 space-y-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-6 w-96 mb-8" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}
