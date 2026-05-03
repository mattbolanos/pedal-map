import { Link } from "@tanstack/react-router";
import { useMemo, useRef } from "react";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent } from "#/components/ui/card";
import {
  formatDistance,
  type GeoCoordinates,
  getDistanceBetweenCoordinates,
} from "#/lib/geo";

interface StationNearbyCurrentStation {
  lat: number;
  lon: number;
  stationId: string;
}

interface StationNearbyStation {
  bikesAvailable: number | null;
  docksAvailable: number | null;
  isActive?: boolean;
  lat: number;
  lon: number;
  name: string;
  regionId: string | null;
  stationId: string;
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
    .filter((station) => station.stationId !== currentStation.stationId)
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
        (resultB.station.bikesAvailable ?? 0) -
          (resultA.station.bikesAvailable ?? 0) ||
        resultA.station.name.localeCompare(resultB.station.name),
    )
    .slice(0, 5);
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

    if (
      activePreviewStationIdRef.current !== null ||
      activePreviewStationIdRef.current === station.stationId ||
      immediate
    ) {
      activePreviewStationIdRef.current = station.stationId;
      onPreviewStationChange?.(station);
      return;
    }

    previewDelayRef.current = window.setTimeout(() => {
      activePreviewStationIdRef.current = station.stationId;
      onPreviewStationChange?.(station);
      previewDelayRef.current = null;
    }, INITIAL_PREVIEW_DELAY_MS);
  };

  if (nearbyStations.length === 0) {
    return null;
  }

  return (
    <div
      className="flex h-full flex-col gap-3"
      onPointerLeave={() => {
        clearPreviewStation();
      }}
    >
      <h3>Neighbors</h3>
      <Card size="sm" className="flex-1 rounded-lg py-2! shadow-xs">
        <CardContent className="space-y-1 px-1.5!">
          {nearbyStations.map((result) => (
            <NearbyStationLink
              key={result.station.stationId}
              distanceLabel={result.distanceLabel}
              onClearPreviewStation={clearPreviewStation}
              onPreviewStation={previewStation}
              station={result.station}
            />
          ))}
        </CardContent>
      </Card>
    </div>
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
      params={{ id: station.stationId }}
      aria-label={`View ${station.name} station profile`}
      onBlur={() => {
        onClearPreviewStation();
      }}
      onFocus={() => {
        onPreviewStation(station, true);
      }}
      onPointerEnter={() => {
        onPreviewStation(station);
      }}
      className="hover:bg-accent focus-visible:border-ring focus-visible:ring-ring/50 flex w-full cursor-default items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-[background-color,scale] outline-none focus-visible:ring-[3px]"
    >
      <span className="min-w-0 flex-1 truncate">{station.name}</span>
      <div className="ml-auto flex shrink-0 items-center gap-2 pl-3">
        <span className="text-muted-foreground text-xs tabular-nums">
          {distanceLabel}
        </span>
        {station.isActive === false ? (
          <Badge variant="offline" aria-label="Offline">
            Offline
          </Badge>
        ) : null}
      </div>
    </Link>
  );
}
