import {
  type Layer,
  type MapViewState,
  type PickingInfo,
  WebMercatorViewport,
} from "@deck.gl/core";
import { DeckGL } from "@deck.gl/react";
import { useQuery } from "@tanstack/react-query";
import type { LngLatBoundsLike } from "mapbox-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Map as MapView } from "react-map-gl/mapbox";
import {
  createStationPinsLayer,
  SMALL_TO_MEDIUM_DOTS_ZOOM,
} from "#/components/station-pins-layer";
import { StationDrawer, StationTooltip } from "#/components/station-tooltip";
import { Drawer } from "#/components/ui/drawer";
import { useIsMobile } from "#/hooks/use-mobile";
import type { CitiBikeStation } from "#/lib/citibike";
import { citiBikeStationsQueryOptions } from "#/lib/citibike";
import { MapControls } from "./map-controls";

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAP_STYLE_URL = "mapbox://styles/mapbox/dark-v11";

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: -73.9651,
  latitude: 40.6917,
  zoom: 13.8,
  bearing: 0,
  pitch: 0,
};

const NYC_METRO_BOUNDS: LngLatBoundsLike = [
  [-74.3, 40.5],
  [-73.7, 40.95],
];

const MIN_ZOOM = 10.65;
const MAX_ZOOM = 15.1;
const STATION_HIT_AREA = 10;
const TOOLTIP_GAP = 18;
const TOOLTIP_VIEWPORT_PADDING = 20;

interface HoveredStation {
  station: CitiBikeStation;
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

function toStationState(station: CitiBikeStation): HoveredStation {
  return { station };
}

export function StationMap() {
  const { data: citiBikeStations } = useQuery(citiBikeStationsQueryOptions);
  const stations = citiBikeStations?.stations ?? [];
  const [viewState, setViewState] = useState(() =>
    clampViewState(INITIAL_VIEW_STATE),
  );
  const [hoveredStation, setHoveredStation] = useState<HoveredStation | null>(
    null,
  );
  const [pinnedStation, setPinnedStation] = useState<HoveredStation | null>(
    null,
  );
  const [selectedStation, setSelectedStation] = useState<HoveredStation | null>(
    null,
  );
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  const [tooltipPosition, setTooltipPosition] =
    useState<TooltipPosition | null>(null);
  const hoveredStationIdRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const tooltipPositionFrameRef = useRef<number | null>(null);
  const canHover = viewState.zoom >= SMALL_TO_MEDIUM_DOTS_ZOOM;
  const displayedStation = hoveredStation ?? pinnedStation;

  const clearHoveredStation = () => {
    if (tooltipPositionFrameRef.current !== null) {
      cancelAnimationFrame(tooltipPositionFrameRef.current);
      tooltipPositionFrameRef.current = null;
    }

    if (hoveredStationIdRef.current !== null) {
      hoveredStationIdRef.current = null;
      setHoveredStation(null);
      setTooltipPosition(null);
    }
  };

  const clearPinnedStation = () => {
    setPinnedStation(null);
    setTooltipPosition(null);
  };

  const updateTooltipPosition = (
    station: CitiBikeStation,
    nextViewState: MapViewState,
  ) => {
    if (!containerRef.current || !tooltipRef.current) {
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
      ...nextViewState,
      width: containerRect.width,
      height: containerRect.height,
    });
    const [anchorX, anchorY] = viewport.project([station.lon, station.lat]);

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
  };

  const scheduleTooltipPosition = (
    station: CitiBikeStation,
    nextViewState: MapViewState,
  ) => {
    if (tooltipPositionFrameRef.current !== null) {
      cancelAnimationFrame(tooltipPositionFrameRef.current);
    }

    tooltipPositionFrameRef.current = requestAnimationFrame(() => {
      tooltipPositionFrameRef.current = null;
      updateTooltipPosition(station, nextViewState);
    });
  };

  const handleHover = (info: PickingInfo<CitiBikeStation>) => {
    if (!canHover || isMobile) {
      return;
    }

    const station = info.object;

    if (!station) {
      clearHoveredStation();
      return;
    }

    hoveredStationIdRef.current = station.station_id;
    scheduleTooltipPosition(station, viewState);
    setHoveredStation((current) => {
      if (current?.station === station) {
        return current;
      }

      return {
        station,
      };
    });
  };

  const focusStation = (station: CitiBikeStation) => {
    const nextViewState = clampViewState({
      ...viewState,
      longitude: station.lon,
      latitude: station.lat,
      zoom: Math.max(viewState.zoom, SMALL_TO_MEDIUM_DOTS_ZOOM),
    });

    setViewState(nextViewState);

    if (isMobile) {
      clearHoveredStation();
      setPinnedStation(null);
      setSelectedStation(toStationState(station));
      setIsMobileDrawerOpen(true);
      return;
    }

    hoveredStationIdRef.current = null;
    setHoveredStation(null);
    setSelectedStation(null);
    setPinnedStation(toStationState(station));
    setTooltipPosition(null);
  };

  const handleMapClick = (info: PickingInfo<CitiBikeStation>) => {
    if (!isMobile) {
      return;
    }

    const station = info.object;

    if (!station) {
      clearHoveredStation();
      return;
    }

    hoveredStationIdRef.current = station.station_id;
    setIsMobileDrawerOpen(true);
    setSelectedStation((current) => {
      if (current?.station === station) {
        return current;
      }

      return {
        station,
      };
    });
  };

  // Vaul not respecting modal b/c of controlled open :/
  useEffect(() => {
    if (isMobile && isMobileDrawerOpen) {
      window.requestAnimationFrame(() => {
        document.body.style.pointerEvents = "auto";
      });
    }
  }, [isMobile, isMobileDrawerOpen]);

  useEffect(() => {
    return () => {
      if (tooltipPositionFrameRef.current !== null) {
        cancelAnimationFrame(tooltipPositionFrameRef.current);
      }
    };
  }, []);

  const layers = useMemo(() => {
    const nextLayers: Layer[] = [];

    if (stations.length === 0) {
      return nextLayers;
    }

    const layer = createStationPinsLayer(stations, viewState.zoom);

    if (!layer) {
      return nextLayers;
    }

    nextLayers.push(...(Array.isArray(layer) ? layer : [layer]));

    return nextLayers;
  }, [stations, viewState.zoom]);

  return (
    <div className="relative size-full" ref={containerRef}>
      <MapControls stations={stations} onSelectStation={focusStation} />
      <DeckGL
        controller
        getCursor={({ isDragging, isHovering }) =>
          isDragging ? "grabbing" : canHover && isHovering ? "pointer" : "grab"
        }
        layers={layers}
        onClick={handleMapClick}
        onDragStart={() => {
          if (!isMobile) {
            clearHoveredStation();
            clearPinnedStation();
          }
        }}
        onHover={handleHover}
        pickingRadius={STATION_HIT_AREA}
        onViewStateChange={({ viewState: nextViewState }) => {
          if (!isMobile) {
            clearHoveredStation();
          }
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

      {displayedStation ? (
        <div
          className="pointer-events-none absolute z-20 hidden md:block"
          ref={(node) => {
            tooltipRef.current = node;

            if (node && displayedStation) {
              scheduleTooltipPosition(displayedStation.station, viewState);
            }
          }}
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
          <StationTooltip station={displayedStation.station} />
        </div>
      ) : null}

      <Drawer
        open={isMobile && isMobileDrawerOpen}
        noBodyStyles={true}
        modal={false}
        setBackgroundColorOnScale={false}
        onOpenChange={setIsMobileDrawerOpen}
        onAnimationEnd={(open) => {
          if (!open) {
            setSelectedStation(null);
          }
        }}
      >
        {isMobile && selectedStation ? (
          <StationDrawer station={selectedStation.station} />
        ) : null}
      </Drawer>
    </div>
  );
}
