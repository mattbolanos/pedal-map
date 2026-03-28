import type { MapViewState, PickingInfo } from "@deck.gl/core";
import { DeckGL } from "@deck.gl/react";
import { useQuery } from "@tanstack/react-query";
import type { LngLatBoundsLike } from "mapbox-gl";
import { useMemo, useState } from "react";
import { Map as MapView } from "react-map-gl/mapbox";
import { createStationPinsLayer } from "#/components/station-pins-layer";
import type { CitiBikeStation } from "#/lib/citibike";
import { citiBikeStationsQueryOptions } from "#/lib/citibike";

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAP_STYLE_URL = "mapbox://styles/mapbox/dark-v11";

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: -73.9651,
  latitude: 40.6917,
  zoom: 13.75,
  bearing: 0,
  pitch: 0,
};

const NYC_METRO_BOUNDS: LngLatBoundsLike = [
  [-74.3, 40.5],
  [-73.7, 40.95],
];

const MIN_ZOOM = 10.65;
const MAX_ZOOM = 16;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function clampViewState(viewState: MapViewState): MapViewState {
  const [[minLon, minLat], [maxLon, maxLat]] = NYC_METRO_BOUNDS as [
    [number, number],
    [number, number],
  ];

  return {
    ...viewState,
    longitude: clamp(viewState.longitude, minLon, maxLon),
    latitude: clamp(viewState.latitude, minLat, maxLat),
    zoom: clamp(viewState.zoom, MIN_ZOOM, MAX_ZOOM),
  };
}

export function StationMap() {
  const { data: citiBikeStations } = useQuery(citiBikeStationsQueryOptions);
  const [viewState, setViewState] = useState(() =>
    clampViewState(INITIAL_VIEW_STATE),
  );

  const layers = useMemo(() => {
    if (!citiBikeStations) {
      return [];
    }

    const layer = createStationPinsLayer(
      citiBikeStations.stations,
      viewState.zoom,
    );

    if (!layer) {
      return [];
    }

    return Array.isArray(layer) ? layer : [layer];
  }, [citiBikeStations, viewState.zoom]);

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
      layers={layers}
      onViewStateChange={({ viewState: nextViewState }) =>
        setViewState(clampViewState(nextViewState as MapViewState))
      }
      viewState={viewState}
    >
      <MapView
        mapStyle={MAP_STYLE_URL}
        mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
        maxBounds={NYC_METRO_BOUNDS}
        maxZoom={MAX_ZOOM}
        minZoom={MIN_ZOOM}
        renderWorldCopies={false}
        reuseMaps
      />
    </DeckGL>
  );
}
