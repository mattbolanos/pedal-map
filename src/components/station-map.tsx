import {
  type MapViewState,
  type PickingInfo,
  WebMercatorViewport,
} from "@deck.gl/core";
import { DeckGL } from "@deck.gl/react";
import { useQuery } from "@tanstack/react-query";
import type { LngLatBoundsLike } from "mapbox-gl";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Map as MapView } from "react-map-gl/mapbox";
import {
  createStationPinsLayer,
  SMALL_TO_MEDIUM_DOTS_ZOOM,
} from "#/components/station-pins-layer";
import { StationTooltip } from "#/components/station-tooltip";
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
const STATION_HIT_SLOP = 8;
const TOOLTIP_GAP = 18;
const TOOLTIP_VIEWPORT_PADDING = 12;

interface HoveredStation {
  station: CitiBikeStation;
}

interface CursorState {
  isDragging: boolean;
  isHovering: boolean;
}

interface TooltipPosition {
  left: number;
  top: number;
}

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
  const [hoveredStation, setHoveredStation] = useState<HoveredStation | null>(
    null,
  );
  const [tooltipPosition, setTooltipPosition] =
    useState<TooltipPosition | null>(null);
  const hoveredStationIdRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const canHover = viewState.zoom >= SMALL_TO_MEDIUM_DOTS_ZOOM;

  const clearHoveredStation = () => {
    if (hoveredStationIdRef.current !== null) {
      hoveredStationIdRef.current = null;
      setHoveredStation(null);
      setTooltipPosition(null);
    }
  };

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

  const handleHover = (info: PickingInfo<CitiBikeStation>) => {
    if (!canHover) {
      clearHoveredStation();
      return;
    }

    const station = info.object;

    if (!station) {
      clearHoveredStation();
      return;
    }

    hoveredStationIdRef.current = station.station_id;
    setHoveredStation((current) => {
      if (current?.station === station) {
        return current;
      }

      return {
        station,
      };
    });
  };

  useLayoutEffect(() => {
    if (!hoveredStation || !containerRef.current || !tooltipRef.current) {
      setTooltipPosition(null);
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    if (
      containerRect.width === 0 ||
      containerRect.height === 0 ||
      tooltipRect.width === 0 ||
      tooltipRect.height === 0
    ) {
      setTooltipPosition(null);
      return;
    }

    const viewport = new WebMercatorViewport({
      ...viewState,
      width: containerRect.width,
      height: containerRect.height,
    });
    const [anchorX, anchorY] = viewport.project([
      hoveredStation.station.lon,
      hoveredStation.station.lat,
    ]);

    const minLeft = TOOLTIP_VIEWPORT_PADDING;
    const maxLeft = Math.max(
      minLeft,
      containerRect.width - tooltipRect.width - TOOLTIP_VIEWPORT_PADDING,
    );
    const left = clamp(anchorX - tooltipRect.width / 2, minLeft, maxLeft);

    const aboveTop = anchorY - tooltipRect.height - TOOLTIP_GAP;
    const belowTop = anchorY + TOOLTIP_GAP;
    const canPlaceAbove = aboveTop >= TOOLTIP_VIEWPORT_PADDING;
    const canPlaceBelow =
      belowTop + tooltipRect.height <=
      containerRect.height - TOOLTIP_VIEWPORT_PADDING;

    const desiredTop = canPlaceAbove || !canPlaceBelow ? aboveTop : belowTop;
    const minTop = TOOLTIP_VIEWPORT_PADDING;
    const maxTop = Math.max(
      minTop,
      containerRect.height - tooltipRect.height - TOOLTIP_VIEWPORT_PADDING,
    );
    const top = clamp(desiredTop, minTop, maxTop);

    setTooltipPosition((current) => {
      if (current && current.left === left && current.top === top) {
        return current;
      }

      return { left, top };
    });
  }, [hoveredStation, viewState]);

  return (
    <div className="relative h-full w-full" ref={containerRef}>
      <DeckGL
        controller
        getCursor={({ isDragging, isHovering }: CursorState) =>
          isDragging ? "grabbing" : canHover && isHovering ? "pointer" : "grab"
        }
        layers={layers}
        onDragStart={clearHoveredStation}
        onHover={handleHover}
        pickingRadius={STATION_HIT_SLOP}
        onViewStateChange={({ viewState: nextViewState }) => {
          clearHoveredStation();
          setViewState(clampViewState(nextViewState as MapViewState));
        }}
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

      {hoveredStation ? (
        <div
          className="pointer-events-none absolute z-20"
          ref={tooltipRef}
          style={
            tooltipPosition
              ? {
                  left: tooltipPosition.left,
                  top: tooltipPosition.top,
                }
              : {
                  left: 0,
                  top: 0,
                  visibility: "hidden",
                }
          }
        >
          <StationTooltip station={hoveredStation.station} />
        </div>
      ) : null}
    </div>
  );
}
