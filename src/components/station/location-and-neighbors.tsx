import { memo, useState } from "react";
import { StationLocationMapTile } from "#/components/station/location-map-tile";
import { StationNeighbors } from "#/components/station/neighbors";

interface StationLocationAndNeighborsStation {
  lat: number;
  lon: number;
  name: string;
  station_id: string;
  num_bikes_available?: number;
  is_installed?: 0 | 1;
  is_renting?: 0 | 1;
  is_returning?: 0 | 1;
}

interface StationLocationAndNeighborsProps {
  station: StationLocationAndNeighborsStation;
  stations: StationLocationAndNeighborsStation[];
}

export const StationLocationAndNeighbors = memo(
  function StationLocationAndNeighbors({
    station,
    stations,
  }: StationLocationAndNeighborsProps) {
    const [previewStation, setPreviewStation] =
      useState<StationLocationAndNeighborsStation | null>(null);

    return (
      <>
        <StationLocationMapTile
          previewStation={previewStation}
          station={station}
        />
        <StationNeighbors
          currentStation={station}
          onPreviewStationChange={setPreviewStation}
          stations={stations}
        />
      </>
    );
  },
);
