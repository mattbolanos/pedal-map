import { memo, useMemo, useState } from "react";
import { StationLocationMapTile } from "#/components/station/location-map-tile";
import { StationNeighbors } from "#/components/station/neighbors";

interface StationLocationAndNeighborsStation {
  lat: number;
  lon: number;
  name: string;
  regionId: string | null;
  stationId: string;
}

interface StationLocationAndNeighborsNearbyStation {
  lat: number;
  lon: number;
  name: string;
  region_id?: string;
  station_id: string;
}

interface StationLocationAndNeighborsProps {
  station: StationLocationAndNeighborsStation;
  stations: StationLocationAndNeighborsNearbyStation[];
}

export const StationLocationAndNeighbors = memo(
  function StationLocationAndNeighbors({
    station,
    stations,
  }: StationLocationAndNeighborsProps) {
    const [previewStation, setPreviewStation] =
      useState<StationLocationAndNeighborsStation | null>(null);
    const nearbyStations = useMemo(
      () =>
        stations.map((nearbyStation) => ({
          bikesAvailable: null,
          docksAvailable: null,
          lat: nearbyStation.lat,
          lon: nearbyStation.lon,
          name: nearbyStation.name,
          regionId: nearbyStation.region_id ?? null,
          stationId: nearbyStation.station_id,
        })),
      [stations],
    );

    return (
      <>
        <StationLocationMapTile
          previewStation={previewStation}
          station={station}
        />
        <StationNeighbors
          currentStation={station}
          onPreviewStationChange={setPreviewStation}
          stations={nearbyStations}
        />
      </>
    );
  },
);
