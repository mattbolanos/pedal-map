import type { MapViewState } from "@deck.gl/core";
import { IconLayer, ScatterplotLayer } from "@deck.gl/layers";
import { DeckGL } from "@deck.gl/react";
import { useEffect, useRef, useState } from "react";
import { Map as MapView } from "react-map-gl/mapbox";
import { MAX_ZOOM } from "#/components/station-map-view-state";
import { usePrefersReducedMotion } from "#/hooks/use-reduced-motion";
import { MAP_STYLE_URL, MAPBOX_ACCESS_TOKEN } from "#/lib/station-map";
import { getStationRegion } from "#/lib/station-region";

interface StationLocationMapTileStation {
  lat: number;
  lon: number;
  name: string;
  regionId: string | null;
  stationId: string;
}

interface StationLocationMapTileProps {
  previewStation?: StationLocationMapTileStation | null;
  station: StationLocationMapTileStation;
}

const TILE_PITCH = 38;
const FALLBACK_STATION_REGION_COLOR = [114, 130, 138] as const;
const SELECTED_STATION_ALPHA = 255;
const SELECTED_STATION_GLOW_ALPHA = 92;
const NEARBY_STATION_ALPHA = 153;
const NEARBY_STATION_GLOW_ALPHA = 30;
const PIN_ICON_SIZE = 64;
const SELECTED_PIN_SIZE = 36;
const NEARBY_PIN_SIZE = 30;
const TILE_CAMERA_MIN_DURATION_MS = 360;
const TILE_CAMERA_MAX_DURATION_MS = 760;
const TILE_CAMERA_DISTANCE_DURATION_FACTOR = 90_000;
const PIN_TRANSITION = {
  duration: 220,
  easing: (value: number) => 1 - (1 - value) ** 3,
};
const PIN_ICON_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${PIN_ICON_SIZE}" height="${PIN_ICON_SIZE}" viewBox="0 0 ${PIN_ICON_SIZE} ${PIN_ICON_SIZE}"><path fill="#000" d="M32 4C20.4 4 11 13.4 11 25c0 15.8 21 35 21 35s21-19.2 21-35C53 13.4 43.6 4 32 4Zm0 31.5A10.5 10.5 0 1 1 32 14.5a10.5 10.5 0 0 1 0 21Z"/></svg>`,
)}`;

const easeInOutCubic = (value: number) =>
  value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;

function stationRegionColor(station: StationLocationMapTileStation) {
  return (
    getStationRegion(station.regionId, station.stationId)?.pinColor ??
    FALLBACK_STATION_REGION_COLOR
  );
}

function stationColor(
  station: StationLocationMapTileStation,
  alpha: number,
): [number, number, number, number] {
  const [red, green, blue] = stationRegionColor(station);
  return [red, green, blue, alpha];
}

function isSameStationLocation(
  stationA: StationLocationMapTileStation,
  stationB: StationLocationMapTileStation,
) {
  return stationA.lat === stationB.lat && stationA.lon === stationB.lon;
}

function hasValidCoordinates(station: { lat: number; lon: number }) {
  return (
    Number.isFinite(station.lat) &&
    Number.isFinite(station.lon) &&
    station.lat >= -90 &&
    station.lat <= 90 &&
    station.lon >= -180 &&
    station.lon <= 180
  );
}

function createTileViewState(station: {
  lat: number;
  lon: number;
}): MapViewState {
  return {
    bearing: 0,
    latitude: station.lat,
    longitude: station.lon,
    pitch: TILE_PITCH,
    zoom: MAX_ZOOM,
  };
}

export function StationLocationMapTile({
  previewStation,
  station,
}: StationLocationMapTileProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [viewState, setViewState] = useState(() =>
    createTileViewState(station),
  );
  const [pinScale, setPinScale] = useState(1);
  const animationFrameRef = useRef<number | null>(null);
  const pinAnimationFrameRef = useRef<number | null>(null);
  const viewStateRef = useRef(viewState);
  const hasValidStation = hasValidCoordinates(station);
  const focusedStation =
    previewStation && hasValidCoordinates(previewStation)
      ? previewStation
      : station;
  const focusedStationLat = focusedStation.lat;
  const focusedStationLon = focusedStation.lon;
  const stationLat = station.lat;
  const stationLon = station.lon;
  const pinAnimationKey = `${focusedStationLat}:${focusedStationLon}`;
  const nearbyStations =
    previewStation &&
    hasValidCoordinates(previewStation) &&
    !isSameStationLocation(previewStation, station)
      ? [previewStation]
      : [];

  useEffect(() => {
    viewStateRef.current = viewState;
  }, [viewState]);

  useEffect(() => {
    if (!hasValidStation) {
      return;
    }

    const nextViewState = createTileViewState({
      lat: stationLat,
      lon: stationLon,
    });
    viewStateRef.current = nextViewState;
    setViewState(nextViewState);
  }, [hasValidStation, stationLat, stationLon]);

  useEffect(() => {
    if (
      !hasValidCoordinates({ lat: focusedStationLat, lon: focusedStationLon })
    ) {
      return;
    }

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const startViewState = viewStateRef.current;
    const targetViewState = createTileViewState({
      lat: focusedStationLat,
      lon: focusedStationLon,
    });

    if (prefersReducedMotion) {
      viewStateRef.current = targetViewState;
      setViewState(targetViewState);
      return;
    }

    const longitudeDistance =
      targetViewState.longitude - startViewState.longitude;
    const latitudeDistance = targetViewState.latitude - startViewState.latitude;
    const coordinateDistance = Math.hypot(longitudeDistance, latitudeDistance);
    const duration = Math.min(
      TILE_CAMERA_MAX_DURATION_MS,
      Math.max(
        TILE_CAMERA_MIN_DURATION_MS,
        coordinateDistance * TILE_CAMERA_DISTANCE_DURATION_FACTOR,
      ),
    );
    const startedAt = performance.now();

    const animateCamera = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const easedProgress = easeInOutCubic(progress);
      const nextViewState: MapViewState = {
        ...startViewState,
        bearing:
          (startViewState.bearing ?? 0) +
          ((targetViewState.bearing ?? 0) - (startViewState.bearing ?? 0)) *
            easedProgress,
        latitude: startViewState.latitude + latitudeDistance * easedProgress,
        longitude: startViewState.longitude + longitudeDistance * easedProgress,
        pitch:
          (startViewState.pitch ?? TILE_PITCH) +
          ((targetViewState.pitch ?? TILE_PITCH) -
            (startViewState.pitch ?? TILE_PITCH)) *
            easedProgress,
        zoom:
          startViewState.zoom +
          ((targetViewState.zoom ?? MAX_ZOOM) -
            (startViewState.zoom ?? MAX_ZOOM)) *
            easedProgress,
      };

      viewStateRef.current = nextViewState;
      setViewState(nextViewState);

      if (progress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(animateCamera);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = window.requestAnimationFrame(animateCamera);

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [focusedStationLat, focusedStationLon, prefersReducedMotion]);

  useEffect(() => {
    void pinAnimationKey;

    if (pinAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(pinAnimationFrameRef.current);
      pinAnimationFrameRef.current = null;
    }

    if (prefersReducedMotion) {
      setPinScale(1);
      return;
    }

    const duration = 260;
    const startedAt = performance.now();
    setPinScale(0);

    const animatePin = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const easedProgress = 1 - (1 - progress) ** 3;
      setPinScale(0.74 + easedProgress * 0.26);

      if (progress < 1) {
        pinAnimationFrameRef.current = window.requestAnimationFrame(animatePin);
      } else {
        pinAnimationFrameRef.current = null;
      }
    };

    pinAnimationFrameRef.current = window.requestAnimationFrame(animatePin);

    return () => {
      if (pinAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(pinAnimationFrameRef.current);
        pinAnimationFrameRef.current = null;
      }
    };
  }, [pinAnimationKey, prefersReducedMotion]);

  if (!hasValidStation) {
    return null;
  }

  const layers = [
    new ScatterplotLayer<StationLocationMapTileStation>({
      id: "station-location-nearby-glow",
      data: nearbyStations,
      filled: true,
      getFillColor: (nearbyStation) =>
        stationColor(nearbyStation, NEARBY_STATION_GLOW_ALPHA),
      getPosition: (nearbyStation) => [nearbyStation.lon, nearbyStation.lat],
      getRadius: NEARBY_PIN_SIZE * 0.38,
      pickable: false,
      radiusUnits: "pixels",
      stroked: false,
    }),
    new ScatterplotLayer<StationLocationMapTileStation>({
      id: "station-location-selected-glow",
      data: [station],
      filled: true,
      getFillColor: (selectedStation) =>
        stationColor(selectedStation, SELECTED_STATION_GLOW_ALPHA),
      getPosition: (selectedStation) => [
        selectedStation.lon,
        selectedStation.lat,
      ],
      getRadius: SELECTED_PIN_SIZE * 0.68,
      pickable: false,
      radiusUnits: "pixels",
      stroked: false,
      transitions: {
        getRadius: PIN_TRANSITION,
      },
    }),
    new IconLayer<StationLocationMapTileStation>({
      id: "station-location-nearby-pin",
      data: nearbyStations,
      getColor: (nearbyStation) =>
        stationColor(nearbyStation, NEARBY_STATION_ALPHA),
      getIcon: () => ({
        anchorY: PIN_ICON_SIZE,
        height: PIN_ICON_SIZE,
        mask: true,
        url: PIN_ICON_URL,
        width: PIN_ICON_SIZE,
      }),
      getPosition: (nearbyStation) => [nearbyStation.lon, nearbyStation.lat],
      getSize: (nearbyStation) =>
        NEARBY_PIN_SIZE *
        pinScale *
        (previewStation && isSameStationLocation(nearbyStation, previewStation)
          ? 1.02
          : 1),
      pickable: false,
      sizeUnits: "pixels",
      transitions: {
        getColor: PIN_TRANSITION,
        getSize: PIN_TRANSITION,
      },
      updateTriggers: {
        getSize: pinScale,
      },
    }),
    new IconLayer<StationLocationMapTileStation>({
      id: "station-location-selected-pin",
      data: [station],
      getColor: (selectedStation) =>
        stationColor(selectedStation, SELECTED_STATION_ALPHA),
      getIcon: () => ({
        anchorY: PIN_ICON_SIZE,
        height: PIN_ICON_SIZE,
        mask: true,
        url: PIN_ICON_URL,
        width: PIN_ICON_SIZE,
      }),
      getPosition: (selectedStation) => [
        selectedStation.lon,
        selectedStation.lat,
      ],
      getSize: SELECTED_PIN_SIZE * pinScale,
      pickable: false,
      sizeUnits: "pixels",
      transitions: {
        getColor: PIN_TRANSITION,
        getSize: PIN_TRANSITION,
      },
      updateTriggers: {
        getSize: pinScale,
      },
    }),
  ];

  return (
    <div className="flex h-full flex-col gap-3">
      <h3>Location</h3>
      <div className="border-border bg-card relative min-h-52 flex-1 overflow-hidden rounded-lg border shadow-xs">
        <DeckGL
          controller={false}
          getCursor={() => "default"}
          layers={layers}
          viewState={viewState}>
          <MapView
            attributionControl={false}
            interactive={false}
            mapStyle={MAP_STYLE_URL}
            mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
            renderWorldCopies={false}
          />
        </DeckGL>
      </div>
    </div>
  );
}
