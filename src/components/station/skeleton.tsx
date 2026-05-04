import { Card, CardContent, CardHeader } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";

const NEIGHBOR_ROW_KEYS = Array.from(
  { length: 5 },
  (_, index) => `station-neighbor-skeleton-${index}`,
);

const LEGEND_ITEM_KEYS = Array.from(
  { length: 2 },
  (_, index) => `station-chart-legend-skeleton-${index}`,
);

export function StationDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="border-border bg-card ring-foreground/10 relative min-h-52 overflow-hidden rounded-2xl border md:h-98">
          <Skeleton className="h-full w-full rounded-none" />
        </div>

        <Card className="h-full md:h-98">
          <CardHeader className="gap-4 px-4.5!">
            <Skeleton className="h-7 w-28" />
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-1 px-1.5! pb-3">
            {NEIGHBOR_ROW_KEYS.map((key) => (
              <div
                key={key}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5"
              >
                <Skeleton className="h-5 min-w-0 flex-1" />
                <Skeleton className="h-4 w-14 shrink-0" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="h-full md:h-98">
          <CardHeader className="gap-3 px-4.5!">
            <Skeleton className="h-7 w-20" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-40 rounded-full" />
              <Skeleton className="h-8 w-40 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col px-2 pt-0 pb-3 sm:px-4">
            <Skeleton className="h-full min-h-56 w-full" />
            <div className="flex items-center justify-center gap-4 pt-2">
              {LEGEND_ITEM_KEYS.map((key) => (
                <div key={key} className="flex items-center gap-1.5">
                  <Skeleton className="h-2 w-2 rounded-[2px]" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="h-full md:h-98">
          <CardHeader className="px-4.5!">
            <Skeleton className="h-7 w-44" />
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col px-2 pt-0 pb-3 sm:px-4">
            <Skeleton className="h-full min-h-56 w-full" />
            <div className="flex items-center justify-center gap-4 pt-2">
              {LEGEND_ITEM_KEYS.map((key) => (
                <div
                  key={`${key}-comparison`}
                  className="flex items-center gap-1.5"
                >
                  <Skeleton className="h-2 w-2 rounded-[2px]" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
