import { Skeleton } from "@g4k/ui/components";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  );
}
