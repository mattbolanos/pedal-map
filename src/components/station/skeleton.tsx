import { Skeleton } from "#/components/ui/skeleton";

export function StationDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex h-10 items-center">
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="border-border bg-card space-y-3 rounded-lg border p-4">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-44 w-full" />
      </div>
    </div>
  );
}
