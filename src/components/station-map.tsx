import type { PickingInfo } from "@deck.gl/core";
import { DeckGL } from "@deck.gl/react";
import { useQuery } from "@tanstack/react-query";
import type { LngLatBoundsLike } from "mapbox-gl";
import { useMemo } from "react";
import { Map as MapView } from "react-map-gl/mapbox";
import { createStationPinsLayer } from "#/components/station-pins-layer";
import type { CitiBikeStation } from "#/lib/citibike";
import { citiBikeStationsQueryOptions } from "#/lib/citibike";

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAP_STYLE_URL = "mapbox://styles/mapbox/dark-v11";

const INITIAL_VIEW_STATE = {
  longitude: -73.9651,
  latitude: 40.6917,
  zoom: 13.03,
  bearing: 0,
  pitch: 0,
};
const MIN_ZOOM = 9.5;
const NYC_METRO_BOUNDS: LngLatBoundsLike = [
  [-74.65, 40.3],
  [-73.3, 41.1],
];

export function StationMap() {
  const { data: citiBikeStations } = useQuery(citiBikeStationsQueryOptions);
  const layers = useMemo(() => {
    if (!citiBikeStations) {
      return [];
    }

    const layer = createStationPinsLayer(citiBikeStations.stations);

    return layer ? [layer] : [];
  }, [citiBikeStations]);

  const getTooltip = (info: PickingInfo<CitiBikeStation>) => {
    const station = info.object;

    if (!station) {
      return null;
    }

    const bikes = station.num_bikes_available ?? 0;
    const docks = station.num_docks_available ?? 0;
    const ebikes = station.num_ebikes_available ?? 0;
    const status =
      station.is_renting === 1 && station.is_installed === 1
        ? "Active"
        : "Offline";

    return {
      text: `${station.name}
${status}
Bikes: ${bikes}
Docks: ${docks}
E-bikes: ${ebikes}`,
    };
  };

  return (
    <DeckGL
      controller
      getTooltip={getTooltip}
      initialViewState={INITIAL_VIEW_STATE}
      layers={layers}
    >
      <MapView
        mapStyle={MAP_STYLE_URL}
        mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
        maxBounds={NYC_METRO_BOUNDS}
        minZoom={MIN_ZOOM}
        renderWorldCopies={false}
        reuseMaps
      />
    </DeckGL>
  );
}
