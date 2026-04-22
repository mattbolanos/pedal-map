import { IconLayer, ScatterplotLayer } from "@deck.gl/layers";
import type { CitiBikeStation } from "#/lib/citibike";
import type { GeoCoordinates } from "#/lib/geo";
import {
  availabilityColor,
  bucketRatio,
  getPinIconUrl,
  ICON_RES,
  ICON_SIZE_SCALE,
  pinSize,
} from "#/lib/station-pin";

const SMALL_TO_MEDIUM_DOTS_ZOOM = 12;
export const DOTS_TO_PINS_ZOOM = 13.75;

function hasValidCoordinates(s: CitiBikeStation) {
  return (
    Number.isFinite(s.lat) &&
    Number.isFinite(s.lon) &&
    s.lat >= -90 &&
    s.lat <= 90 &&
    s.lon >= -180 &&
    s.lon <= 180
  );
}

function availabilityRatio(s: CitiBikeStation): number {
  const bikes = s.num_bikes_available ?? 0;
  const docks = s.num_docks_available ?? 0;
  const total = bikes + docks;
  return total === 0 ? 0 : bikes / total;
}

function isActive(s: CitiBikeStation): boolean {
  return s.is_renting === 1 && s.is_installed === 1;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function scaledPinSize(capacity: number, zoom: number) {
  const zoomScale = clamp(0.9 + (zoom - DOTS_TO_PINS_ZOOM) * 0.18, 0.9, 1.3);
  return pinSize(capacity) * zoomScale;
}

function mixColor(
  color: [number, number, number, number],
  target: [number, number, number],
  amount: number,
  alpha = color[3],
) {
  return [
    Math.round(color[0] + (target[0] - color[0]) * amount),
    Math.round(color[1] + (target[1] - color[1]) * amount),
    Math.round(color[2] + (target[2] - color[2]) * amount),
    alpha,
  ] as const;
}

function dotGlowColor(station: CitiBikeStation) {
  const color = availabilityColor(
    availabilityRatio(station),
    isActive(station),
  );
  return mixColor(color, [255, 255, 255], 0.08, 52);
}

function dotFieldColor(station: CitiBikeStation) {
  const color = availabilityColor(
    availabilityRatio(station),
    isActive(station),
  );
  return mixColor(color, [255, 255, 255], 0.14, 92);
}

function dotCoreColor(station: CitiBikeStation) {
  const color = availabilityColor(
    availabilityRatio(station),
    isActive(station),
  );
  return mixColor(color, [255, 255, 255], 0.1, 210);
}

function dotFieldRadius(capacity: number, zoom: number) {
  const zoomScale = clamp(0.9 + (zoom - 9.75) * 0.06, 0.9, 1.08);
  const capacityScale = 2.8 + Math.sqrt(Math.max(0, capacity)) * 0.22;
  return clamp(capacityScale * zoomScale, 3, 6);
}

function dotCoreRadius(capacity: number, zoom: number) {
  const zoomScale = clamp(0.95 + (zoom - 9.75) * 0.05, 0.95, 1.12);
  const capacityScale = 1.2 + Math.sqrt(Math.max(0, capacity)) * 0.08;
  return clamp(capacityScale * zoomScale, 1.4, 3.2);
}

function dotZoomTierScale(zoom: number) {
  return zoom < SMALL_TO_MEDIUM_DOTS_ZOOM ? 1 : 1.5;
}

const easeOut = (t: number) => t * (2 - t);
const PIN_TRANSITION = { duration: 140, easing: easeOut };
const USER_LOCATION_CORE_COLOR = [255, 255, 255, 255] as const;
const USER_LOCATION_RING_COLOR = [56, 189, 248, 245] as const;
const USER_LOCATION_GLOW_COLOR = [56, 189, 248, 84] as const;
const USER_LOCATION_ACCURACY_FILL = [56, 189, 248, 22] as const;
const USER_LOCATION_ACCURACY_LINE = [56, 189, 248, 78] as const;

function isSelectedStation(
  station: CitiBikeStation,
  selectedStationIds: ReadonlySet<string>,
) {
  return selectedStationIds.has(station.station_id);
}

const SELECTED_HALO_COLOR = [59, 130, 246, 100] as const;

function selectedPinGlowRadius(capacity: number, zoom: number) {
  return clamp(scaledPinSize(capacity, zoom) * 0.58, 12, 22);
}

export function createStationPinsLayer(
  stations: CitiBikeStation[],
  zoom: number,
  selectedStationIdsInput: readonly string[] = [],
) {
  const valid = stations.filter(hasValidCoordinates);
  if (valid.length === 0) return null;
  const dotScale = dotZoomTierScale(zoom);
  const selectedStationIds = new Set(selectedStationIdsInput);
  const selectedStations =
    selectedStationIds.size > 0
      ? valid.filter((station) =>
          isSelectedStation(station, selectedStationIds),
        )
      : [];

  if (zoom < DOTS_TO_PINS_ZOOM) {
    return [
      ...(selectedStations.length > 0
        ? [
            new ScatterplotLayer<CitiBikeStation>({
              id: "station-pins-dot-selected-glow",
              data: selectedStations,
              filled: true,
              pickable: false,
              stroked: false,
              getPosition: (station) => [station.lon, station.lat],
              getRadius: (station) =>
                dotFieldRadius(station.capacity ?? 0, zoom) * dotScale + 5,
              getFillColor: SELECTED_HALO_COLOR,
              radiusUnits: "pixels",
              radiusMinPixels: 8 * dotScale,
              radiusMaxPixels: 12 * dotScale,
              transitions: {
                getFillColor: PIN_TRANSITION,
                getRadius: PIN_TRANSITION,
              },
              updateTriggers: {
                getFillColor: [stations, zoom, selectedStationIdsInput],
                getRadius: [stations, zoom, selectedStationIdsInput],
              },
            }),
            new ScatterplotLayer<CitiBikeStation>({
              id: "station-pins-dot-selected-ring",
              data: selectedStations,
              filled: false,
              pickable: false,
              stroked: true,
              getPosition: (station) => [station.lon, station.lat],
              getRadius: (station) =>
                dotFieldRadius(station.capacity ?? 0, zoom) * dotScale + 3.2,
              getLineColor: [59, 130, 246, 160],
              getLineWidth: 1.3,
              lineWidthUnits: "pixels",
              lineWidthMinPixels: 1.3,
              lineWidthMaxPixels: 2,
              radiusUnits: "pixels",
              radiusMinPixels: 6.5 * dotScale,
              radiusMaxPixels: 10 * dotScale,
              transitions: {
                getLineColor: PIN_TRANSITION,
                getRadius: PIN_TRANSITION,
              },
              updateTriggers: {
                getLineColor: [stations, zoom, selectedStationIdsInput],
                getRadius: [stations, zoom, selectedStationIdsInput],
              },
            }),
          ]
        : []),
      new ScatterplotLayer<CitiBikeStation>({
        id: "station-pins-dot-field",
        data: valid,
        filled: true,
        pickable: false,
        stroked: false,
        getPosition: (station) => [station.lon, station.lat],
        getRadius: (station) =>
          dotFieldRadius(station.capacity ?? 0, zoom) * dotScale + 2.5,
        getFillColor: dotGlowColor,
        radiusUnits: "pixels",
        radiusMinPixels: 5 * dotScale,
        radiusMaxPixels: 8.5 * dotScale,
        transitions: {
          getFillColor: PIN_TRANSITION,
          getRadius: PIN_TRANSITION,
        },
        updateTriggers: {
          getFillColor: [stations, zoom],
          getRadius: [stations, zoom],
        },
      }),
      new ScatterplotLayer<CitiBikeStation>({
        id: "station-pins-dot-density",
        data: valid,
        filled: true,
        pickable: false,
        stroked: false,
        getPosition: (station) => [station.lon, station.lat],
        getRadius: (station) =>
          dotFieldRadius(station.capacity ?? 0, zoom) * dotScale,
        getFillColor: dotFieldColor,
        radiusUnits: "pixels",
        radiusMinPixels: 3 * dotScale,
        radiusMaxPixels: 6 * dotScale,
        transitions: {
          getFillColor: PIN_TRANSITION,
          getRadius: PIN_TRANSITION,
        },
        updateTriggers: {
          getFillColor: [stations, zoom],
          getRadius: [stations, zoom],
        },
      }),
      new ScatterplotLayer<CitiBikeStation>({
        id: "station-pins-dot-core",
        data: valid,
        filled: true,
        pickable: true,
        stroked: false,
        getPosition: (station) => [station.lon, station.lat],
        getRadius: (station) =>
          dotCoreRadius(station.capacity ?? 0, zoom) * dotScale +
          (isSelectedStation(station, selectedStationIds) ? 0.65 : 0),
        getFillColor: dotCoreColor,
        radiusUnits: "pixels",
        radiusMinPixels: 1.5 * dotScale,
        radiusMaxPixels: 3.5 * dotScale,
        transitions: {
          getFillColor: PIN_TRANSITION,
          getRadius: PIN_TRANSITION,
        },
        updateTriggers: {
          getFillColor: [stations, zoom],
          getRadius: [stations, zoom, selectedStationIdsInput],
        },
      }),
    ];
  }

  const iconLayer = new IconLayer<CitiBikeStation>({
    id: "station-pins",
    data: valid,
    pickable: true,

    getPosition: (s) => [s.lon, s.lat],

    getIcon: (s) => {
      const bucket = isActive(s) ? bucketRatio(availabilityRatio(s)) : 0;
      return {
        url: getPinIconUrl(bucket, isSelectedStation(s, selectedStationIds)),
        width: ICON_RES,
        height: ICON_RES,
        mask: true,
      };
    },

    getColor: (s) => availabilityColor(availabilityRatio(s), isActive(s)),
    getSize: (s) =>
      scaledPinSize(s.capacity ?? 0, zoom) *
      ICON_SIZE_SCALE *
      (isSelectedStation(s, selectedStationIds) ? 1.12 : 1),

    sizeUnits: "pixels",
    sizeMinPixels: 18 * ICON_SIZE_SCALE,
    sizeMaxPixels: 36 * ICON_SIZE_SCALE,

    transitions: {
      getColor: PIN_TRANSITION,
      getSize: PIN_TRANSITION,
    },

    updateTriggers: {
      getIcon: [stations, selectedStationIdsInput],
      getColor: stations,
      getSize: [stations, zoom, selectedStationIdsInput],
    },
  });

  if (selectedStations.length === 0) {
    return iconLayer;
  }

  return [
    new ScatterplotLayer<CitiBikeStation>({
      id: "station-pins-selected-glow",
      data: selectedStations,
      filled: true,
      pickable: false,
      stroked: false,
      getPosition: (station) => [station.lon, station.lat],
      getRadius: (station) =>
        selectedPinGlowRadius(station.capacity ?? 0, zoom),
      getFillColor: SELECTED_HALO_COLOR,
      radiusUnits: "pixels",
      radiusMinPixels: 12,
      radiusMaxPixels: 24,
      transitions: {
        getFillColor: PIN_TRANSITION,
        getRadius: PIN_TRANSITION,
      },
      updateTriggers: {
        getFillColor: [stations, zoom, selectedStationIdsInput],
        getRadius: [stations, zoom, selectedStationIdsInput],
      },
    }),
    iconLayer,
  ];
}

export function createUserLocationLayer(userLocation: GeoCoordinates | null) {
  if (!userLocation) {
    return null;
  }

  const layers = [];

  if ((userLocation.accuracy ?? 0) > 25) {
    layers.push(
      new ScatterplotLayer<GeoCoordinates>({
        id: "user-location-accuracy",
        data: [userLocation],
        filled: true,
        pickable: false,
        stroked: true,
        getPosition: (coordinates) => [coordinates.lon, coordinates.lat],
        getRadius: (coordinates) => Math.min(coordinates.accuracy ?? 0, 1200),
        radiusUnits: "meters",
        getFillColor: USER_LOCATION_ACCURACY_FILL,
        getLineColor: USER_LOCATION_ACCURACY_LINE,
        getLineWidth: 1.5,
        lineWidthUnits: "pixels",
        lineWidthMinPixels: 1,
        lineWidthMaxPixels: 2,
      }),
    );
  }

  layers.push(
    new ScatterplotLayer<GeoCoordinates>({
      id: "user-location-glow",
      data: [userLocation],
      filled: true,
      pickable: false,
      stroked: false,
      getPosition: (coordinates) => [coordinates.lon, coordinates.lat],
      getRadius: 13,
      radiusUnits: "pixels",
      radiusMinPixels: 13,
      radiusMaxPixels: 13,
      getFillColor: USER_LOCATION_GLOW_COLOR,
    }),
    new ScatterplotLayer<GeoCoordinates>({
      id: "user-location-ring",
      data: [userLocation],
      filled: true,
      pickable: false,
      stroked: true,
      getPosition: (coordinates) => [coordinates.lon, coordinates.lat],
      getRadius: 7,
      radiusUnits: "pixels",
      radiusMinPixels: 7,
      radiusMaxPixels: 7,
      getFillColor: USER_LOCATION_CORE_COLOR,
      getLineColor: USER_LOCATION_RING_COLOR,
      getLineWidth: 2.5,
      lineWidthUnits: "pixels",
      lineWidthMinPixels: 2.5,
      lineWidthMaxPixels: 2.5,
    }),
    new ScatterplotLayer<GeoCoordinates>({
      id: "user-location-core",
      data: [userLocation],
      filled: true,
      pickable: false,
      stroked: false,
      getPosition: (coordinates) => [coordinates.lon, coordinates.lat],
      getRadius: 3,
      radiusUnits: "pixels",
      radiusMinPixels: 3,
      radiusMaxPixels: 3,
      getFillColor: USER_LOCATION_RING_COLOR,
    }),
  );

  return layers;
}
