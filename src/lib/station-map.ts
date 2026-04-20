import type { MapViewState } from "@deck.gl/core";

export const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
export const MAP_STYLE_URL = "mapbox://styles/mapbox/dark-v11";

export const INITIAL_VIEW_STATE: MapViewState = {
  longitude: -73.9651,
  latitude: 40.6917,
  zoom: 13.0,
  bearing: 0,
  pitch: 0,
};

export const STATION_HIT_AREA = 12;
export const DESKTOP_HOVER_LEAVE_DELAY_MS = 100;
export const TOOLTIP_GAP = 18;
export const TOOLTIP_VIEWPORT_PADDING = 20;
export const SELECTED_DESKTOP_PANEL_GAP = 16;
export const DESKTOP_SELECTED_STATION_X_RATIO = 0.5;
export const DESKTOP_SELECTED_STATION_Y_RATIO = 0.62;
export const MOBILE_SELECTED_STATION_Y_RATIO = 0.3;
export const USER_LOCATION_TOAST_ID = "user-location-status";
