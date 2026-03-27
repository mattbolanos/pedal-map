import { useSuspenseQuery } from "@tanstack/react-query";
import type { LngLatBoundsLike } from "maplibre-gl";
import { useRef } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import MapView from "react-map-gl/maplibre";
import { StationPinsLayer } from "#/components/station-pins-layer";
import { citiBikeStationsQueryOptions } from "#/lib/citibike";

const MAP_STYLE_URL = `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`;
const INITIAL_VIEW_STATE = {
  longitude: -73.9651,
  latitude: 40.6917,
  zoom: 13.03,
};
const MIN_ZOOM = 9.5;
const NYC_METRO_BOUNDS: LngLatBoundsLike = [
  [-74.65, 40.3],
  [-73.3, 41.1],
];

export function StationMap() {
  const mapRef = useRef<MapRef | null>(null);

  const { data: citiBikeStations } = useSuspenseQuery(
    citiBikeStationsQueryOptions,
  );

  return (
    <MapView
      initialViewState={INITIAL_VIEW_STATE}
      mapStyle={MAP_STYLE_URL}
      maxBounds={NYC_METRO_BOUNDS}
      minZoom={MIN_ZOOM}
      ref={mapRef}
      renderWorldCopies={false}
      reuseMaps
    >
      <StationPinsLayer stations={citiBikeStations.stations} />
    </MapView>
  );
}
