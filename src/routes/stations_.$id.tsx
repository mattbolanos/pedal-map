import { ArrowUDownLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowUDownLeft";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  notFound,
  useCanGoBack,
  useRouter,
} from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Suspense, useMemo, useState } from "react";
import { NotFound } from "#/components/not-found";
import { StationLocationMapTile } from "#/components/station/location-map-tile";
import { StationNeighbors } from "#/components/station/neighbors";
import { StationProfile } from "#/components/station/profile";
import { StationRanks } from "#/components/station/ranks";
import {
  StationDetailSkeleton,
  StationRanksSkeleton,
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

interface StationPreview {
  bikesAvailable: number | null;
  docksAvailable: number | null;
  isActive?: boolean;
  lat: number;
  lon: number;
  name: string;
  regionId: string | null;
  stationId: string;
}

function toStationPreview(station: {
  lat: number;
  lon: number;
  name: string;
  region_id?: string;
  station_id: string;
}): StationPreview {
  return {
    bikesAvailable: null,
    docksAvailable: null,
    lat: station.lat,
    lon: station.lon,
    name: station.name,
    regionId: station.region_id ?? null,
    stationId: station.station_id,
  };
}

function StationProfilePanels({ stationId }: { stationId: string }) {
  const { data: profile } = useSuspenseQuery({
    queryKey: ["station-availability-profile", stationId, STATION_PROFILE_DAYS],
    queryFn: () =>
      convex.query(api.pedalMap.getStationAvailabilityProfile, {
        days: STATION_PROFILE_DAYS,
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
  station: StationPreview;
  stations: StationPreview[];
}) {
  const [previewStation, setPreviewStation] = useState<StationPreview | null>(
    null,
  );

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
  previewStation: StationPreview | null;
  station: StationPreview;
}) {
  return (
    <StationLocationMapTile previewStation={previewStation} station={station} />
  );
}

function StationDetailContent({ stationId }: { stationId: string }) {
  const { data: stationInformation } = useSuspenseQuery(
    stationInformationQueryOptions,
  );
  const stations = useMemo(
    () => stationInformation.data.stations.map(toStationPreview),
    [stationInformation],
  );
  const station = stations.find(
    (candidate) => candidate.stationId === stationId,
  );

  if (!station) {
    throw notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">{station.name}</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <StationProfilePanels stationId={stationId} />
        <StationRanksPanel stationId={stationId} />
        <StationLocationAndNeighborsPanels
          station={station}
          stations={stations}
        />
      </div>
    </div>
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
        onClick={goBack}
      >
        <ArrowUDownLeftIcon className="size-5 md:size-4" />
        Back
      </button>
      <Suspense fallback={<StationDetailSkeleton />}>
        <StationDetailContent stationId={id} />
      </Suspense>
    </main>
  );
}
