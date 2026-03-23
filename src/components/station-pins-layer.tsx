import { useMemo } from "react";
import { Marker } from "react-map-gl/maplibre";
import type { CitiBikeStation } from "#/lib/citibike";

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

export function StationPinsLayer({
  stations,
  viewportBounds,
}: StationPinsLayerProps) {
  const visibleStations = useMemo(() => {
    const validStations = stations.filter(hasValidCoordinates);

    if (!viewportBounds) {
      return validStations;
    }

    const paddedBounds = expandBounds(viewportBounds, VIEWPORT_PADDING);

    return validStations.filter((station) =>
      isStationWithinBounds(station, paddedBounds),
    );
  }, [stations, viewportBounds]);

  if (visibleStations.length === 0) {
    return null;
  }

  return visibleStations.map((station) => (
    <Marker
      key={station.station_id}
      anchor="center"
      latitude={station.lat}
      longitude={station.lon}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none relative flex size-4 items-center justify-center"
        title={station.name}
      >
        <div className="absolute inset-0 translate-y-[1.5px] rounded-full bg-slate-950/55 blur-[2px]" />
        <div className="absolute inset-[1px] rounded-full bg-cyan-300/35 blur-[4px]" />
        <div className="relative size-2.5 rounded-full border border-cyan-50/95 bg-slate-950/95 shadow-[0_0_16px_rgba(103,232,249,0.34)]" />
        <div className="absolute size-1 rounded-full bg-slate-50" />
      </div>
    </Marker>
  ));
}
export interface MapViewportBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}
