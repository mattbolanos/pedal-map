import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { Suspense, useMemo, useState } from "react";
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
  StationRanksSkeleton,
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
import { buildCurrentStationRanks } from "#/lib/station-ranks";

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

function stationProfileQueryOptions(stationId: string) {
  return {
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
  };
}

function StationChartPanels({
  stationCapacity,
  stationId,
}: {
  stationCapacity: number | null;
  stationId: string;
}) {
  const { data: profile } = useSuspenseQuery(
    stationProfileQueryOptions(stationId),
  );
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

function StationRanksPanel({
  stationId,
  stations,
}: {
  stationId: string;
  stations: CitiBikeStation[];
}) {
  const { data: profile } = useSuspenseQuery(
    stationProfileQueryOptions(stationId),
  );
  const currentRanks = useMemo(
    () => buildCurrentStationRanks(stations),
    [stations],
  ).get(stationId);

  if (!currentRanks) return null;

  return (
    <StationRanks
      latestRanks={currentRanks}
      latestStationCount={stations.length}
      averageRanks={profile.averageRanks}
      averageStationCount={profile.averageRankStationCount}
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
          <Suspense fallback={<StationRanksSkeleton />}>
            <StationRanksPanel stationId={id} stations={stations} />
          </Suspense>
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
