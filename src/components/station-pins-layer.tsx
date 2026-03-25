import { memo, useMemo } from "react";
import { Marker } from "react-map-gl/maplibre";
import type { CitiBikeStation } from "#/lib/citibike";
import { StationPin } from "./station-pin";

interface StationPinsLayerProps {
  stations: CitiBikeStation[];
  viewportBounds?: MapViewportBounds | null;
}

const VIEWPORT_PADDING = 0.2;

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

function expandBounds(bounds: MapViewportBounds, padding: number) {
  const latitudePadding = (bounds.north - bounds.south) * padding;
  const longitudePadding = (bounds.east - bounds.west) * padding;

  return {
    west: bounds.west - longitudePadding,
    south: Math.max(-90, bounds.south - latitudePadding),
    east: bounds.east + longitudePadding,
    north: Math.min(90, bounds.north + latitudePadding),
  };
}

function isLongitudeWithinBounds(
  longitude: number,
  west: number,
  east: number,
) {
  if (west <= east) {
    return longitude >= west && longitude <= east;
  }

  return longitude >= west || longitude <= east;
}

function isStationWithinBounds(
  station: CitiBikeStation,
  bounds: MapViewportBounds,
) {
  return (
    station.lat >= bounds.south &&
    station.lat <= bounds.north &&
    isLongitudeWithinBounds(station.lon, bounds.west, bounds.east)
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
});

export function StationPinsLayer({
  stations,
  viewportBounds,
}: StationPinsLayerProps) {
  const validStations = useMemo(
    () => stations.filter(hasValidCoordinates),
    [stations],
  );

  const visibleStations = useMemo(() => {
    if (!viewportBounds) {
      return validStations;
    }

    const paddedBounds = expandBounds(viewportBounds, VIEWPORT_PADDING);

    return validStations.filter((station) =>
      isStationWithinBounds(station, paddedBounds),
    );
  }, [validStations, viewportBounds]);

  if (visibleStations.length === 0) {
    return null;
  }

  return visibleStations.map((station) => (
    <StationMarker key={station.station_id} station={station} />
  ));
}
export interface MapViewportBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}
