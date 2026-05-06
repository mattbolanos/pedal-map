import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";

const NEIGHBOR_ROW_KEYS = Array.from(
  { length: 8 },
  (_, index) => `station-neighbor-skeleton-${index}`,
);
const RANK_ROW_KEYS = [
  "station-rank-current-bikes-skeleton",
  "station-rank-current-ebikes-skeleton",
  "station-rank-average-bikes-skeleton",
  "station-rank-average-ebikes-skeleton",
];

export function StationTitleSkeleton() {
  return <Skeleton className="h-7 w-56" />;
}

export function StationMapTileSkeleton() {
  return (
    <div className="border-border bg-card ring-foreground/10 relative min-h-52 overflow-hidden rounded-2xl border md:h-98">
      <Skeleton className="h-full w-full rounded-none" />
    </div>
  );
}

export function StationNeighborsSkeleton() {
  return (
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
  );
}

export function StationPeaksChartSkeleton() {
  return (
    <Card className="h-full md:h-98">
      <CardHeader className="gap-3 px-4.5!">
        <CardTitle>Bikes</CardTitle>
        <Skeleton className="h-4 w-36" />
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col px-2 pt-0 pb-3 sm:px-4">
        <Skeleton className="h-full min-h-74 w-full" />
      </CardContent>
    </Card>
  );
}

export function StationComparisonChartSkeleton() {
  return (
    <Card className="h-full md:h-98">
      <CardHeader className="px-4.5!">
        <CardTitle>Weekdays and Weekends</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col px-2 pt-0 pb-3 sm:px-4">
        <Skeleton className="h-full min-h-74 w-full" />
      </CardContent>
    </Card>
  );
}

export function StationRanksSkeleton() {
  return (
    <Card className="md:col-span-2">
      <CardHeader className="px-4.5!">
        <Skeleton className="h-7 w-32" />
      </CardHeader>
      <CardContent className="grid items-stretch gap-2 px-1.5! sm:grid-cols-2 lg:grid-cols-4">
        {RANK_ROW_KEYS.map((key) => (
          <div
            key={key}
            className="bg-muted/35 grid min-h-30 grid-rows-[2rem_auto_auto] rounded-2xl px-3 py-3"
          >
            <div>
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-end justify-between gap-3">
              <div className="space-y-1.5">
                <Skeleton className="h-7 w-14" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="ml-auto h-4 w-12" />
                <Skeleton className="ml-auto h-4 w-8" />
              </div>
            </div>
            <div className="pt-3">
              <Skeleton className="h-1.5 w-full rounded-full" />
              <Skeleton className="mt-1.5 ml-auto h-3 w-8" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function StationDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <StationTitleSkeleton />
      <div className="grid gap-6 md:grid-cols-2">
        <StationRanksSkeleton />
        <StationPeaksChartSkeleton />
        <StationComparisonChartSkeleton />
        <StationMapTileSkeleton />
        <StationNeighborsSkeleton />
      </div>
    </div>
  );
}
