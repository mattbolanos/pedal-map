import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { Suspense, useState } from "react";
import { NotFound } from "#/components/not-found";
import { RouteBreadcrumb } from "#/components/route-breadcrumb";
import { ComparisonChart } from "#/components/station/comparison-chart";
import { StationLocationMapTile } from "#/components/station/location-map-tile";
import { StationNeighbors } from "#/components/station/neighbors";
import { PeaksChart, peakMetrics } from "#/components/station/peaks-chart";
import { StationRanks } from "#/components/station/ranks";
import {
  StationComparisonChartSkeleton,
  StationDetailSkeleton,
  StationPeaksChartSkeleton,
} from "#/components/station/skeleton";
import { api } from "#/integrations/convex/api";
import {
  convex,
  prewarmStationAvailabilityProfile,
  STATION_AVAILABILITY_PROFILE_DAYS,
} from "#/integrations/convex/root-provider";
import {
  type CitiBikeStation,
  citiBikeStationsQueryOptions,
} from "#/lib/citibike";

export const Route = createFileRoute("/_stations/stations_/$id")({
  loader: async ({ context, params }) => {
    prewarmStationAvailabilityProfile(params.id);
    return await context.queryClient.ensureQueryData(
      citiBikeStationsQueryOptions,
    );
  },
  head: () => ({
    meta: [
      {
        title: "Station | Pedal Map",
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
  pendingComponent: StationDetailSkeleton,
  component: StationDetailPage,
});

interface StationPreviewStation {
  capacity?: number;
  lat: number;
  lon: number;
  name: string;
  region_id?: string;
  station_id: string;
}

function StationChartPanels({
  stationCapacity,
  stationId,
}: {
  stationCapacity: number | null;
  stationId: string;
}) {
  const { data: profile } = useSuspenseQuery({
    queryKey: [
      "station-availability-profile",
      stationId,
      STATION_AVAILABILITY_PROFILE_DAYS,
    ],
    queryFn: () =>
      convex.query(api.pedalMap.getStationAvailabilityProfile, {
        days: STATION_AVAILABILITY_PROFILE_DAYS,
        stationId,
      }),
  });
  return (
    <>
      {peakMetrics.map((metric) => (
        <PeaksChart
          key={metric.key}
          metricKey={metric.key}
          stationCapacity={stationCapacity}
          weekdayProfile={profile.weekdayProfile}
          weekendProfile={profile.weekendProfile}
        />
      ))}
      <ComparisonChart
        weekdayProfile={profile.weekdayProfile}
        weekendProfile={profile.weekendProfile}
      />
    </>
  );
}

function getCurrentRank(
  stations: CitiBikeStation[],
  stationId: string,
  getValue: (station: CitiBikeStation) => number | undefined,
) {
  const station = stations.find(
    (candidate) => candidate.station_id === stationId,
  );
  const stationValue = station ? getValue(station) : undefined;

  if (stationValue === undefined) {
    return null;
  }

  return (
    stations.reduce(
      (higherCount, candidate) =>
        (getValue(candidate) ?? Number.NEGATIVE_INFINITY) > stationValue
          ? higherCount + 1
          : higherCount,
      0,
    ) + 1
  );
}

function StationRanksPanel({
  stationId,
  stations,
}: {
  stationId: string;
  stations: CitiBikeStation[];
}) {
  const station = stations.find(
    (candidate) => candidate.station_id === stationId,
  );

  if (!station) return null;

  return (
    <StationRanks
      station={{
        ranks: {
          bikesAvailable: getCurrentRank(
            stations,
            stationId,
            (candidate) => candidate.num_bikes_available,
          ),
          ebikesAvailable: getCurrentRank(
            stations,
            stationId,
            (candidate) => candidate.num_ebikes_available,
          ),
        },
      }}
      stationCount={stations.length}
    />
  );
}

function StationLocationAndNeighborsPanels({
  station,
  stations,
}: {
  station: StationPreviewStation;
  stations: StationPreviewStation[];
}) {
  const [previewStation, setPreviewStation] =
    useState<StationPreviewStation | null>(null);

  return (
    <>
      <StationLocationPanel previewStation={previewStation} station={station} />
      <StationNeighbors
        currentStation={station}
        onPreviewStationChange={setPreviewStation}
        stations={stations}
      />
    </>
  );
}

function StationLocationPanel({
  previewStation,
  station,
}: {
  previewStation: StationPreviewStation | null;
  station: StationPreviewStation;
}) {
  return (
    <StationLocationMapTile previewStation={previewStation} station={station} />
  );
}

function StationDetailPage() {
  const { id } = Route.useParams();
  const { data: stationInformation } = useSuspenseQuery(
    citiBikeStationsQueryOptions,
  );

  const stations = stationInformation.stations;
  const station = stations.find((candidate) => candidate.station_id === id);

  if (!station) {
    throw notFound();
  }

  return (
    <>
      <RouteBreadcrumb
        current={station.name}
        links={[{ label: "Stations", to: "/stations" }]}
      />
      <div className="flex flex-col gap-6">
        <h1 className="text-xl font-bold">{station.name}</h1>
        <div className="grid gap-6 md:grid-cols-2">
          <StationRanksPanel stationId={id} stations={stations} />
          <Suspense
            fallback={
              <>
                <StationPeaksChartSkeleton title="Average Bikes" />
                <StationPeaksChartSkeleton title="Average Electric" />
                <StationPeaksChartSkeleton title="Average Open Dock %" />
                <StationComparisonChartSkeleton />
              </>
            }>
            <StationChartPanels
              stationCapacity={station.capacity ?? null}
              stationId={id}
            />
          </Suspense>
          <StationLocationAndNeighborsPanels
            station={station}
            stations={stations}
          />
        </div>
      </div>
    </>
  );
}
