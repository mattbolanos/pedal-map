import { MapPinAreaIcon } from "@phosphor-icons/react/dist/csr/MapPinArea";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent } from "#/components/ui/card";
import {
  formatDistance,
  type GeoCoordinates,
  getDistanceBetweenCoordinates,
} from "#/lib/geo";
import { getStationRegion, type StationRegionId } from "#/lib/station-region";
import { cn } from "#/lib/utils";

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
  stations: StationNearbyStation[];
}

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

export function StationNearby({
  currentStation,
  stations,
}: StationNearbyProps) {
  const nearbyStations = useMemo(
    () => getNearbyStations(currentStation, stations),
    [currentStation, stations],
  );

  if (nearbyStations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3>Neighbors</h3>
      <Card size="sm" className="rounded-lg shadow-xs">
        <CardContent className="space-y-1">
          {nearbyStations.map((result) => (
            <NearbyStationLink
              key={result.station.stationId}
              distanceLabel={result.distanceLabel}
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
  station,
}: {
  distanceLabel: string;
  station: StationNearbyStation;
}) {
  const region = getStationRegion(
    station.regionId as StationRegionId | null | undefined,
    station.stationId,
  );

  return (
    <Link
      to="/stations/$id"
      params={{ id: station.stationId }}
      aria-label={`View ${station.name} station profile`}
      className="hover:bg-accent focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-11 w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-[background-color,scale] outline-none focus-visible:ring-[3px] active:scale-[0.96]">
      <MapPinAreaIcon className={cn("size-4 shrink-0", region?.pinClassName)} />
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
