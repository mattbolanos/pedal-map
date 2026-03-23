import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import MapView from "react-map-gl/maplibre";
import type { MapViewportBounds } from "#/components/station-pins-layer";
import { StationPinsLayer } from "#/components/station-pins-layer";
import { citiBikeStationsQueryOptions } from "#/lib/citibike";

const MAP_STYLE_URL = `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`;
const INITIAL_VIEW_STATE = {
  longitude: -73.945,
  latitude: 40.719,
  zoom: 12.6,
};

export function StationMap() {
  const mapRef = useRef<MapRef | null>(null);
  const [viewportBounds, setViewportBounds] =
    useState<MapViewportBounds | null>(null);
  const { data: citiBikeStations } = useQuery(citiBikeStationsQueryOptions);

  function syncViewportBounds() {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const bounds = map.getBounds();

    setViewportBounds({
      west: bounds.getWest(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      north: bounds.getNorth(),
    });
  }
  return (
    <MapView
      initialViewState={INITIAL_VIEW_STATE}
      mapStyle={MAP_STYLE_URL}
      onLoad={syncViewportBounds}
      onMoveEnd={syncViewportBounds}
      onResize={syncViewportBounds}
      ref={mapRef}
    >
      <StationPinsLayer
        stations={citiBikeStations?.stations ?? []}
        viewportBounds={viewportBounds}
      />
    </MapView>
  );
}
