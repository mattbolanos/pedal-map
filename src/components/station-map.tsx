import { useQuery } from "@tanstack/react-query";
import type { LngLatBoundsLike } from "maplibre-gl";
import { useRef } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import MapView from "react-map-gl/maplibre";
import { StationPinsLayer } from "#/components/station-pins-layer";
import { citiBikeStationsQueryOptions } from "#/lib/citibike";
import { MAP_STYLE_URL } from "#/lib/map";

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

  const { data: citiBikeStations } = useQuery(citiBikeStationsQueryOptions);

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
      {citiBikeStations ? (
        <StationPinsLayer stations={citiBikeStations.stations} />
      ) : null}
    </MapView>
  );
}
