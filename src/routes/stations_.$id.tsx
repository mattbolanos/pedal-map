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
  StationMapTileSkeleton,
  StationNeighborsSkeleton,
  StationPeaksChartSkeleton,
  StationRanksSkeleton,
  StationTitleSkeleton,
} from "#/components/station/skeleton";
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
  loader: ({ context, params }) => {
    prewarmStationAvailabilityProfile(params.id, STATION_PROFILE_DAYS);
    prewarmStationsTableData();
    void context.queryClient.prefetchQuery(stationInformationQueryOptions);
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
  component: StationDetailPage,
});

function useStationProfile(stationId: string) {
  const { data: profile } = useSuspenseQuery({
    queryKey: ["station-availability-profile", stationId, STATION_PROFILE_DAYS],
    queryFn: () =>
      convex.query(api.pedalMap.getStationAvailabilityProfile, {
        days: STATION_PROFILE_DAYS,
        stationId,
      }),
  });

  if (!profile.station) {
    throw notFound();
  }

  return {
    ...profile,
    station: profile.station,
  };
}

function StationTitle({ stationId }: { stationId: string }) {
  const { station } = useStationProfile(stationId);

  return <h1 className="text-xl font-bold">{station.name}</h1>;
}

function StationPeaksPanel({ stationId }: { stationId: string }) {
  const { weekdayProfile, weekendProfile } = useStationProfile(stationId);
  const stationsTableData = useQuery(api.pedalMap.getStationsTableData);
  const stationStatus =
    stationsTableData?.rows.find((row) => row.stationId === stationId) ?? null;

  return (
    <StationProfile
      chart="peaks"
      stationStatus={stationStatus}
      weekdayProfile={weekdayProfile}
      weekendProfile={weekendProfile}
    />
  );
}

function StationComparisonPanel({ stationId }: { stationId: string }) {
  const { weekdayProfile, weekendProfile } = useStationProfile(stationId);

  return (
    <StationProfile
      chart="comparison"
      stationStatus={null}
      weekdayProfile={weekdayProfile}
      weekendProfile={weekendProfile}
    />
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

interface StationPreview {
  bikesAvailable?: number | null;
  docksAvailable?: number | null;
  isActive?: boolean;
  lat: number;
  lon: number;
  name: string;
  regionId: string | null;
  stationId: string;
}

function StationLocationPanel({
  previewStation,
  stationId,
}: {
  previewStation: StationPreview | null;
  stationId: string;
}) {
  const { station } = useStationProfile(stationId);

  return (
    <StationLocationMapTile previewStation={previewStation} station={station} />
  );
}

function StationNeighborsPanel({
  onPreviewStationChange,
  stationId,
}: {
  onPreviewStationChange: (station: StationPreview | null) => void;
  stationId: string;
}) {
  const { station } = useStationProfile(stationId);
  const { data: stationInformation } = useSuspenseQuery(
    stationInformationQueryOptions,
  );
  const nearbyStations = stationInformation.data.stations.map(
    (nearbyStation) => ({
      bikesAvailable: null,
      docksAvailable: null,
      lat: nearbyStation.lat,
      lon: nearbyStation.lon,
      name: nearbyStation.name,
      regionId: nearbyStation.region_id ?? null,
      stationId: nearbyStation.station_id,
    }),
  );

  return (
    <StationNeighbors
      currentStation={station}
      onPreviewStationChange={onPreviewStationChange}
      stations={nearbyStations}
    />
  );
}

function StationLocationAndNeighborsPanels({
  stationId,
}: {
  stationId: string;
}) {
  const [previewStation, setPreviewStation] = useState<StationPreview | null>(
    null,
  );

  return (
    <>
      <Suspense fallback={<StationMapTileSkeleton />}>
        <StationLocationPanel
          previewStation={previewStation}
          stationId={stationId}
        />
      </Suspense>
      <Suspense fallback={<StationNeighborsSkeleton />}>
        <StationNeighborsPanel
          onPreviewStationChange={setPreviewStation}
          stationId={stationId}
        />
      </Suspense>
    </>
  );
}

function StationDetailPage() {
  const { id } = Route.useParams();
  const canGoBack = useCanGoBack();
  const navigate = Route.useNavigate();
  const router = useRouter();

  const goBack = () => {
    if (canGoBack) {
      router.history.back();
      return;
    }

    navigate({ to: "/" });
  };

  return (
    <main className="route-padding max-w-6xl space-y-3">
      <button
        type="button"
        aria-label="Go back"
        className={cn(buttonVariants({ variant: "text" }), "pl-0")}
        onClick={goBack}>
        <ArrowUDownLeftIcon className="size-5 md:size-4" />
        Back
      </button>
      <div className="flex flex-col gap-6">
        <Suspense fallback={<StationTitleSkeleton />}>
          <StationTitle stationId={id} />
        </Suspense>
        <div className="grid gap-6 md:grid-cols-2">
          <Suspense fallback={<StationPeaksChartSkeleton />}>
            <StationPeaksPanel stationId={id} />
          </Suspense>
          <Suspense fallback={<StationComparisonChartSkeleton />}>
            <StationComparisonPanel stationId={id} />
          </Suspense>
          <StationRanksPanel stationId={id} />
          <StationLocationAndNeighborsPanels stationId={id} />
        </div>
      </div>
    </main>
  );
}
