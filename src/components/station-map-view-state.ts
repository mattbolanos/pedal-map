import { FlyToInterpolator, type MapViewState } from "@deck.gl/core";
import type { CitiBikeStation } from "#/lib/citibike";
import { NYC_METRO_BOUNDS } from "#/lib/geo";

export const MIN_ZOOM = 10.55;
export const MAX_ZOOM = 16;
const STATION_FLY_TO_MIN_DURATION_MS = 1050;
const STATION_FLY_TO_MAX_DURATION_MS = 1750;

const STATION_FLY_TO_INTERPOLATOR = new FlyToInterpolator({ curve: 1.25 });

const easeInOutCubic = (value: number) =>
  value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function clampViewState(viewState: MapViewState): MapViewState {
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

function createFlyToViewState(
  currentViewState: MapViewState,
  targetLongitude: number,
  targetLatitude: number,
  prefersReducedMotion: boolean,
): MapViewState {
  const zoomDistance = Math.abs(MAX_ZOOM - currentViewState.zoom);
  const zoomProgress = zoomDistance / (MAX_ZOOM - MIN_ZOOM);
  const transitionDuration = Math.round(
    STATION_FLY_TO_MIN_DURATION_MS +
      (STATION_FLY_TO_MAX_DURATION_MS - STATION_FLY_TO_MIN_DURATION_MS) *
        clamp(zoomProgress, 0, 1),
  );

  return {
    ...currentViewState,
    longitude: targetLongitude,
    latitude: targetLatitude,
    zoom: MAX_ZOOM,
    transitionDuration: prefersReducedMotion ? 0 : transitionDuration,
    transitionEasing: prefersReducedMotion ? undefined : easeInOutCubic,
    transitionInterpolator: prefersReducedMotion
      ? undefined
      : STATION_FLY_TO_INTERPOLATOR,
  };
}

export function createStationFlyToViewState(
  currentViewState: MapViewState,
  station: CitiBikeStation,
  prefersReducedMotion: boolean,
) {
  return createFlyToViewState(
    currentViewState,
    station.lon,
    station.lat,
    prefersReducedMotion,
  );
}

export function createCoordinatesFlyToViewState(
  currentViewState: MapViewState,
  coords: { lon: number; lat: number },
  prefersReducedMotion: boolean,
) {
  return createFlyToViewState(
    currentViewState,
    coords.lon,
    coords.lat,
    prefersReducedMotion,
  );
}

export function createUserLocationFlyToViewState(
  currentViewState: MapViewState,
  coords: { lon: number; lat: number },
  prefersReducedMotion: boolean,
) {
  return createFlyToViewState(
    currentViewState,
    coords.lon,
    coords.lat,
    prefersReducedMotion,
  );
}
