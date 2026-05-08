import { BicycleIcon } from "@phosphor-icons/react/dist/csr/Bicycle";
import { ChargingStationIcon } from "@phosphor-icons/react/dist/csr/ChargingStation";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";

const NEIGHBOR_ROW_KEYS = Array.from(
  { length: 8 },
  (_, index) => `station-neighbor-skeleton-${index}`,
);

const RANK_GROUPS: {
  title: string;
  metrics: { key: string; label: string; icon: ReactNode }[];
}[] = [
  {
    title: "Latest Ranks",
    metrics: [
      {
        key: "station-rank-current-bikes-skeleton",
        label: "Bikes",
        icon: <BicycleIcon className="size-5" />,
      },
      {
        key: "station-rank-current-ebikes-skeleton",
        label: "Electrics",
        icon: <ChargingStationIcon className="size-5" />,
      },
    ],
  },
  {
    title: "Average Ranks",
    metrics: [
      {
        key: "station-rank-average-bikes-skeleton",
        label: "Bikes",
        icon: <BicycleIcon className="size-5" />,
      },
      {
        key: "station-rank-average-ebikes-skeleton",
        label: "Electrics",
        icon: <ChargingStationIcon className="size-5" />,
      },
    ],
  },
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
      <CardHeader className="px-4.5!">
        <CardTitle>Neighbors</CardTitle>
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

export function StationPeaksChartSkeleton({
  title = "Average Bikes",
}: {
  title?: string;
}) {
  return (
    <Card className="h-full md:h-98">
      <CardHeader className="gap-3 px-4.5!">
        <CardTitle>{title}</CardTitle>
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
        <CardTitle>Weekdays vs Weekends</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col px-2 pt-0 pb-3 sm:px-4">
        <Skeleton className="h-full min-h-74 w-full" />
      </CardContent>
    </Card>
  );
}

export function StationRanksSkeleton() {
  return (
    <>
      {RANK_GROUPS.map((group) => (
        <Card key={group.title} className="pb-3!">
          <CardHeader className="px-4.5!">
            <CardTitle>{group.title}</CardTitle>
          </CardHeader>
          <CardContent className="px-3.5!">
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
              {group.metrics.map((metric) => (
                <div
                  key={metric.key}
                  className="grid min-h-26 grid-rows-[auto_1fr_auto] px-3 py-2.5"
                >
                  <div className="text-muted-foreground flex items-center gap-x-1.5 text-sm">
                    {metric.icon}
                    <span>{metric.label}</span>
                  </div>

                  <div className="flex items-end justify-between gap-3 pt-4 pb-2">
                    <Skeleton className="h-8 w-16" />
                  </div>

                  <div className="space-y-1">
                    <Skeleton className="h-3 w-full rounded-lg" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

export function StationDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <StationTitleSkeleton />
      <div className="grid gap-6 md:grid-cols-2">
        <StationRanksSkeleton />
        <StationPeaksChartSkeleton title="Average Bikes" />
        <StationPeaksChartSkeleton title="Average Electric" />
        <StationPeaksChartSkeleton title="Average Open Dock %" />
        <StationComparisonChartSkeleton />
        <StationMapTileSkeleton />
        <StationNeighborsSkeleton />
      </div>
    </div>
  );
}
