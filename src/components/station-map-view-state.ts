import { FlyToInterpolator, type MapViewState } from "@deck.gl/core";
import type { CitiBikeStation } from "#/lib/citibike";
import { NYC_METRO_BOUNDS } from "#/lib/geo";

export const MIN_ZOOM = 10.55;
export const MAX_ZOOM = 16;
export const STATION_FLY_TO_DURATION_MS = 1050;

const STATION_FLY_TO_INTERPOLATOR = new FlyToInterpolator({ curve: 1.25 });

const easeOutQuint = (value: number) => 1 - (1 - value) ** 5;

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
  return {
    ...currentViewState,
    longitude: targetLongitude,
    latitude: targetLatitude,
    zoom: MAX_ZOOM,
    transitionDuration: prefersReducedMotion ? 0 : STATION_FLY_TO_DURATION_MS,
    transitionEasing: prefersReducedMotion ? undefined : easeOutQuint,
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
