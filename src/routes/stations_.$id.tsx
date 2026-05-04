import { ArrowUDownLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowUDownLeft";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Suspense } from "react";
import { NotFound } from "#/components/not-found";
import { StationLocationAndNeighbors } from "#/components/station/location-and-neighbors";
import { StationProfile } from "#/components/station/profile";
import { StationDetailSkeleton } from "#/components/station/skeleton";
import { buttonVariants } from "#/components/ui/button";
import { api } from "#/integrations/convex/api";
import {
  convex,
  prewarmStationAvailabilityProfile,
  prewarmStationsTableData,
} from "#/integrations/convex/root-provider";
import { stationInformationQueryOptions } from "#/lib/citibike";
import { cn } from "#/lib/utils";

const STATION_PROFILE_DAYS = 30;

export const Route = createFileRoute("/stations_/$id")({
  loader: async ({ params }) => {
    prewarmStationAvailabilityProfile(params.id, STATION_PROFILE_DAYS);
    prewarmStationsTableData();

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

function StationDetailContent({ stationId }: { stationId: string }) {
  const { data: profile } = useSuspenseQuery({
    queryKey: ["station-availability-profile", stationId, STATION_PROFILE_DAYS],
    queryFn: () =>
      convex.query(api.pedalMap.getStationAvailabilityProfile, {
        days: STATION_PROFILE_DAYS,
        stationId,
      }),
  });

  const { data: stationInformation } = useSuspenseQuery(
    stationInformationQueryOptions,
  );
  const { data: stationsTableData } = useSuspenseQuery({
    queryKey: ["stations-table-data"],
    queryFn: () => convex.query(api.pedalMap.getStationsTableData, {}),
  });

  const { station, weekdayProfile, weekendProfile } = profile;
  const stationStatus =
    stationsTableData.rows.find((row) => row.stationId === stationId) ?? null;

  if (!station) {
    return (
      <NotFound
        actionLabel="Back to stations"
        actionTo="/stations"
        message="You took a wrong turn!"
        title="Station not found"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">{station.name}</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <StationProfile
          stationStatus={stationStatus}
          weekdayProfile={weekdayProfile}
          weekendProfile={weekendProfile}
        />
        <StationLocationAndNeighbors
          station={station}
          stations={stationInformation.data.stations}
        />
      </div>
    </div>
  );
}

function StationDetailPage() {
  const { id } = Route.useParams();

  return (
    <main className="route-padding max-w-6xl space-y-3">
      <Link
        to="/stations"
        aria-label="Go back to stations"
        className={cn(buttonVariants({ variant: "text" }), "pl-0")}
      >
        <ArrowUDownLeftIcon className="size-5 md:size-4" />
        Stations
      </Link>
      <Suspense key={id} fallback={<StationDetailSkeleton />}>
        <StationDetailContent stationId={id} />
      </Suspense>
    </main>
  );
}
