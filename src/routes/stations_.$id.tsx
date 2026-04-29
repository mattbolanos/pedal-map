import { ArrowBendUpLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowBendUpLeft";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Suspense } from "react";
import { NotFound } from "#/components/not-found";
import { buttonVariants } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { api } from "#/integrations/convex/api";
import {
  convex,
  prewarmStationAvailabilityProfile,
} from "#/integrations/convex/root-provider";
import { cn } from "#/lib/utils";

const STATION_PROFILE_DAYS = 30;

export const Route = createFileRoute("/stations_/$id")({
  loader: async ({ params }) => {
    prewarmStationAvailabilityProfile(params.id, STATION_PROFILE_DAYS);

    const profile = await convex.query(
      api.pedalMap.getStationAvailabilityProfile,
      {
        days: STATION_PROFILE_DAYS,
        stationId: params.id,
      },
    );

    if (!profile.station) {
      throw notFound();
    }

    return {
      stationName: profile.station.name,
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.stationName ?? "Station"} | Pedal Map`,
      },
    ],
  }),
  notFoundComponent: () => (
    <NotFound
      actionLabel="Back to stations"
      actionTo="/stations"
      message="You took a wrong turn!"
      title="Station not found"
    />
  ),
  component: StationDetailPage,
});

function StationDetailPage() {
  const { id } = Route.useParams();

  return (
    <main className="route-padding max-w-6xl">
      <Suspense fallback={<StationDetailSkeleton />}>
        <StationProfile stationId={id} />
      </Suspense>
    </main>
  );
}

function StationProfile({ stationId }: { stationId: string }) {
  const { data } = useSuspenseQuery({
    queryKey: ["station-availability-profile", stationId, STATION_PROFILE_DAYS],
    queryFn: () =>
      convex.query(api.pedalMap.getStationAvailabilityProfile, {
        days: STATION_PROFILE_DAYS,
        stationId,
      }),
  });

  const station = data.station;

  return (
    <div className="space-y-4">
      <StationDetailBackLink />
      <div className="space-y-1">
        <h1 className="text-xl font-bold">{station?.name ?? "Station"}</h1>
        <p className="text-muted-foreground text-sm">
          Last {data.sampledDayCount} of {data.daysRequested} days sampled
        </p>
      </div>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StationMetric
          label="Capacity"
          value={formatCount(station?.capacity)}
        />
        <StationMetric
          label="Avg. bikes"
          value={formatDecimal(data.summary.avgBikesAvailable)}
        />
        <StationMetric
          label="Avg. docks"
          value={formatDecimal(data.summary.avgDocksAvailable)}
        />
        <StationMetric
          label="Occupancy"
          value={formatPercent(data.summary.avgOccupancyPct)}
        />
      </section>
    </div>
  );
}

function StationDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex h-10 items-center">
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-7 w-64 max-w-full" />
        <Skeleton className="h-4 w-40 max-w-full" />
      </div>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {["capacity", "bikes", "docks", "occupancy"].map((metric) => (
          <div
            key={metric}
            className="border-border bg-card space-y-3 rounded-lg border p-4"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </section>
      <div className="border-border bg-card space-y-3 rounded-lg border p-4">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-44 w-full" />
      </div>
    </div>
  );
}

function StationDetailBackLink() {
  return (
    <Link
      to="/stations"
      aria-label="Go back to stations"
      className={cn(buttonVariants({ variant: "text" }), "pl-0")}
    >
      <ArrowBendUpLeftIcon className="size-5 md:size-4" />
      Back
    </Link>
  );
}

function StationMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border bg-card rounded-lg border p-4">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function formatCount(value: number | null | undefined) {
  return value == null ? "N/A" : value.toLocaleString();
}

function formatDecimal(value: number | null) {
  return value == null
    ? "N/A"
    : value.toLocaleString(undefined, {
        maximumFractionDigits: 1,
      });
}

function formatPercent(value: number | null) {
  return value == null
    ? "N/A"
    : value.toLocaleString(undefined, {
        maximumFractionDigits: 0,
        style: "percent",
      });
}
