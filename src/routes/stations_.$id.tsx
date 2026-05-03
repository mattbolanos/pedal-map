import { ArrowUDownLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowUDownLeft";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Suspense, useState } from "react";
import { NotFound } from "#/components/not-found";
import { StationLocationMapTile } from "#/components/station/location-map-tile";
import { StationNeighbors } from "#/components/station/neighbors";
import { StationDetailSkeleton } from "#/components/station/skeleton";
import { buttonVariants } from "#/components/ui/button";
import { api } from "#/integrations/convex/api";
import {
  convex,
  prewarmStationAvailabilityProfile,
} from "#/integrations/convex/root-provider";
import { stationInformationQueryOptions } from "#/lib/citibike";
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

function StationProfile({ stationId }: { stationId: string }) {
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

  const { station } = profile;
  const [previewStation, setPreviewStation] = useState<{
    lat: number;
    lon: number;
    name: string;
    regionId: string | null;
    stationId: string;
  } | null>(null);

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
    <div className="flex flex-col space-y-6">
      <h1 className="text-xl font-bold">{station.name}</h1>
      <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2">
        <StationLocationMapTile
          previewStation={previewStation}
          station={station}
        />
        <StationNeighbors
          currentStation={station}
          onPreviewStationChange={setPreviewStation}
          stations={stationInformation.data.stations.map((nearbyStation) => ({
            bikesAvailable: null,
            docksAvailable: null,
            lat: nearbyStation.lat,
            lon: nearbyStation.lon,
            name: nearbyStation.name,
            regionId: nearbyStation.region_id ?? null,
            stationId: nearbyStation.station_id,
          }))}
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
        className={cn(buttonVariants({ variant: "text" }), "pl-0")}>
        <ArrowUDownLeftIcon className="size-5 md:size-4" />
        Stations
      </Link>
      <Suspense fallback={<StationDetailSkeleton />}>
        <StationProfile stationId={id} />
      </Suspense>
    </main>
  );
}
