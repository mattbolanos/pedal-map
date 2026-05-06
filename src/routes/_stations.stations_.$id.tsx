import { ArrowUDownLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowUDownLeft";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  notFound,
  useCanGoBack,
  useRouter,
} from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Suspense, useState } from "react";
import { NotFound } from "#/components/not-found";
import { StationLocationMapTile } from "#/components/station/location-map-tile";
import { StationNeighbors } from "#/components/station/neighbors";
import { StationProfile } from "#/components/station/profile";
import { StationRanks } from "#/components/station/ranks";
import {
  StationComparisonChartSkeleton,
  StationDetailSkeleton,
  StationPeaksChartSkeleton,
  StationRanksSkeleton,
} from "#/components/station/skeleton";
import { buttonVariants } from "#/components/ui/button";
import { api } from "#/integrations/convex/api";
import {
  convex,
  prewarmStationAvailabilityProfile,
  prewarmStationsTableData,
  STATION_AVAILABILITY_PROFILE_DAYS,
} from "#/integrations/convex/root-provider";
import { stationInformationQueryOptions } from "#/lib/citibike";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/_stations/stations_/$id")({
  loader: async ({ context, params }) => {
    prewarmStationAvailabilityProfile(params.id);
    prewarmStationsTableData();
    return await context.queryClient.ensureQueryData(
      stationInformationQueryOptions,
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
  lat: number;
  lon: number;
  name: string;
  region_id?: string;
  station_id: string;
}

function StationProfilePanels({ stationId }: { stationId: string }) {
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
  const stationsTableData = useQuery(api.pedalMap.getStationsTableData);
  const stationStatus =
    stationsTableData?.rows.find((row) => row.stationId === stationId) ?? null;

  return (
    <>
      <StationProfile
        chart="peaks"
        stationStatus={stationStatus}
        weekdayProfile={profile.weekdayProfile}
        weekendProfile={profile.weekendProfile}
      />
      <StationProfile
        chart="comparison"
        stationStatus={null}
        weekdayProfile={profile.weekdayProfile}
        weekendProfile={profile.weekendProfile}
      />
    </>
  );
}

function StationRanksPanel({ stationId }: { stationId: string }) {
  const stationsTableData = useQuery(api.pedalMap.getStationsTableData);
  const station =
    stationsTableData?.rows.find((row) => row.stationId === stationId) ?? null;

  if (!stationsTableData) {
    return <StationRanksSkeleton />;
  }

  if (!station) {
    return null;
  }

  return (
    <StationRanks
      station={station}
      stationCount={stationsTableData.rows.length}
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
  const stationInformation = Route.useLoaderData();
  const canGoBack = useCanGoBack();
  const navigate = Route.useNavigate();
  const router = useRouter();

  const stations = stationInformation.data.stations;
  const station = stations.find((candidate) => candidate.station_id === id);

  if (!station) {
    throw notFound();
  }

  const goBack = () => {
    if (canGoBack) {
      router.history.back();
      return;
    }

    navigate({ to: "/" });
  };

  return (
    <>
      <button
        type="button"
        aria-label="Go back"
        className={cn(buttonVariants({ variant: "text" }), "pl-0")}
        onClick={goBack}
      >
        <ArrowUDownLeftIcon className="size-5 md:size-4" />
        Back
      </button>
      <div className="flex flex-col gap-6">
        <h1 className="text-xl font-bold">{station.name}</h1>
        <div className="grid gap-6 md:grid-cols-2">
          <StationRanksPanel stationId={id} />
          <Suspense
            fallback={
              <>
                <StationPeaksChartSkeleton />
                <StationComparisonChartSkeleton />
              </>
            }
          >
            <StationProfilePanels stationId={id} />
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
