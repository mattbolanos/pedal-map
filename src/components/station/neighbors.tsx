import { Link } from "@tanstack/react-router";
import { useMemo, useRef } from "react";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { prewarmStationAvailabilityProfile } from "#/integrations/convex/root-provider";
import {
  formatDistance,
  type GeoCoordinates,
  getDistanceBetweenCoordinates,
} from "#/lib/geo";

interface StationNearbyCurrentStation {
  lat: number;
  lon: number;
  station_id: string;
}

interface StationNearbyStation {
  lat: number;
  lon: number;
  name: string;
  num_bikes_available?: number;
  station_id: string;
  is_installed?: 0 | 1;
  is_renting?: 0 | 1;
  is_returning?: 0 | 1;
}

interface NearbyStationResult {
  distanceLabel: string;
  distanceMeters: number;
  station: StationNearbyStation;
}

interface StationNearbyProps {
  currentStation: StationNearbyCurrentStation;
  onPreviewStationChange?: (station: StationNearbyStation | null) => void;
  stations: StationNearbyStation[];
}

const INITIAL_PREVIEW_DELAY_MS = 200;

function getCoordinates(station: { lat: number; lon: number }): GeoCoordinates {
  return {
    lat: station.lat,
    lon: station.lon,
  };
}

function getNearbyStations(
  currentStation: StationNearbyCurrentStation,
  stations: StationNearbyStation[],
) {
  return stations
    .filter((station) => station.station_id !== currentStation.station_id)
    .map((station): NearbyStationResult | null => {
      const distanceMeters = getDistanceBetweenCoordinates(
        getCoordinates(currentStation),
        getCoordinates(station),
      );
      const distanceLabel = formatDistance(distanceMeters);

      if (!distanceLabel) {
        return null;
      }

      return {
        distanceLabel,
        distanceMeters,
        station,
      };
    })
    .filter((result): result is NearbyStationResult => result !== null)
    .sort(
      (resultA, resultB) =>
        resultA.distanceMeters - resultB.distanceMeters ||
        (resultB.station.num_bikes_available ?? 0) -
          (resultA.station.num_bikes_available ?? 0) ||
        resultA.station.name.localeCompare(resultB.station.name),
    )
    .slice(0, 8);
}

export function StationNeighbors({
  currentStation,
  onPreviewStationChange,
  stations,
}: StationNearbyProps) {
  const activePreviewStationIdRef = useRef<string | null>(null);
  const previewDelayRef = useRef<number | null>(null);
  const nearbyStations = useMemo(
    () => getNearbyStations(currentStation, stations),
    [currentStation, stations],
  );

  const clearPreviewDelay = () => {
    if (previewDelayRef.current !== null) {
      window.clearTimeout(previewDelayRef.current);
      previewDelayRef.current = null;
    }
  };

  const clearPreviewStation = () => {
    clearPreviewDelay();
    activePreviewStationIdRef.current = null;
    onPreviewStationChange?.(null);
  };

  const previewStation = (station: StationNearbyStation, immediate = false) => {
    clearPreviewDelay();
    prewarmStationAvailabilityProfile(station.station_id);

    if (
      activePreviewStationIdRef.current !== null ||
      activePreviewStationIdRef.current === station.station_id ||
      immediate
    ) {
      activePreviewStationIdRef.current = station.station_id;
      onPreviewStationChange?.(station);
      return;
    }

    previewDelayRef.current = window.setTimeout(() => {
      activePreviewStationIdRef.current = station.station_id;
      onPreviewStationChange?.(station);
      previewDelayRef.current = null;
    }, INITIAL_PREVIEW_DELAY_MS);
  };

  if (nearbyStations.length === 0) {
    return null;
  }

  return (
    <Card
      className="flex h-full flex-1 md:h-98"
      onPointerLeave={() => {
        clearPreviewStation();
      }}
    >
      <CardHeader className="px-4.5!">
        <CardTitle>Neighbors</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col space-y-0.5 px-1.5!">
        {nearbyStations.map((result) => {
          prewarmStationAvailabilityProfile(result.station.station_id);

          return (
            <NearbyStationLink
              key={result.station.station_id}
              distanceLabel={result.distanceLabel}
              onClearPreviewStation={clearPreviewStation}
              onPreviewStation={previewStation}
              station={result.station}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}

function NearbyStationLink({
  distanceLabel,
  onClearPreviewStation,

  onPreviewStation,
  station,
}: {
  distanceLabel: string;
  onClearPreviewStation: () => void;
  onPreviewStation: (
    station: StationNearbyStation,
    immediate?: boolean,
  ) => void;
  station: StationNearbyStation;
}) {
  return (
    <Link
      to="/stations/$id"
      params={{ id: station.station_id }}
      aria-label={`View ${station.name} station profile`}
      onBlur={() => {
        onClearPreviewStation();
      }}
      onClick={() => {
        window.scrollTo({ top: 0, left: 0 });
      }}
      onFocus={() => {
        onPreviewStation(station, true);
      }}
      onPointerEnter={() => {
        onPreviewStation(station);
      }}
      className="hover:bg-accent focus-visible:border-ring focus-visible:ring-ring/50 flex w-full cursor-pointer items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-sm transition-[background-color,scale] outline-none focus-visible:ring-[3px]"
    >
      <span className="min-w-0 flex-1 truncate">{station.name}</span>
      <div className="ml-auto flex shrink-0 items-center gap-2 pl-3">
        <span className="text-muted-foreground text-xs tabular-nums">
          {distanceLabel}
        </span>
        {station.is_installed === 0 ||
        station.is_renting === 0 ||
        station.is_returning === 0 ? (
          <Badge variant="offline" aria-label="Offline">
            Offline
          </Badge>
        ) : null}
      </div>
    </Link>
  );
}
