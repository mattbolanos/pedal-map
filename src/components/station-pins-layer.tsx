import { memo, useMemo } from "react";
import { Marker } from "react-map-gl/maplibre";
import type { CitiBikeStation } from "#/lib/citibike";
import { StationPin } from "./station-pin";

interface StationPinsLayerProps {
  stations: CitiBikeStation[];
}

function hasValidCoordinates(station: CitiBikeStation) {
  return (
    Number.isFinite(station.lat) &&
    Number.isFinite(station.lon) &&
    station.lat >= -90 &&
    station.lat <= 90 &&
    station.lon >= -180 &&
    station.lon <= 180
  );
}

const StationMarker = memo(function StationMarker({
  station,
}: {
  station: CitiBikeStation;
}) {
  return (
    <Marker anchor="bottom" latitude={station.lat} longitude={station.lon}>
      <div title={station.name}>
        <StationPin station={station} />
      </div>
    </Marker>
  );
}, areStationMarkerPropsEqual);

function areStationMarkerPropsEqual(
  prev: { station: CitiBikeStation },
  next: { station: CitiBikeStation },
) {
  return prev.station === next.station;
}

export const StationPinsLayer = memo(function StationPinsLayer({
  stations,
}: StationPinsLayerProps) {
  const validStations = useMemo(
    () => stations.filter(hasValidCoordinates),
    [stations],
  );

  if (validStations.length === 0) {
    return null;
  }

  return validStations.map((station) => (
    <StationMarker key={station.station_id} station={station} />
  ));
});
