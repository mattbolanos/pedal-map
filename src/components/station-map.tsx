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
import { createNeighborhoodPolygonsLayer } from "#/lib/neighborhoods";
import { NeighborhoodToggle } from "./neighborhood-toggle";

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
const MAX_ZOOM = process.env.NODE_ENV === "development" ? 22 : 15.2;
const STATION_HIT_AREA = 10;
const TOOLTIP_GAP = 18;
const TOOLTIP_VIEWPORT_PADDING = 20;

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

interface CursorCoordinates {
  lat: number;
  lon: number;
}

interface ClickedCoordinate extends CursorCoordinates {
  id: number;
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
  const [selectedStation, setSelectedStation] = useState<HoveredStation | null>(
    null,
  );
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isNeighborhoodsVisible, setIsNeighborhoodsVisible] = useState(false);
  const isMobile = useIsMobile();
  const [tooltipPosition, setTooltipPosition] =
    useState<TooltipPosition | null>(null);
  const [cursorCoordinates, setCursorCoordinates] =
    useState<CursorCoordinates | null>(null);
  const [clickedCoordinates, setClickedCoordinates] = useState<
    ClickedCoordinate[]
  >([]);
  const [copyButtonLabel, setCopyButtonLabel] = useState("Copy GPT Prompt");
  const [copyArrayButtonLabel, setCopyArrayButtonLabel] =
    useState("Copy TS Array");
  const hoveredStationIdRef = useRef<string | null>(null);
  const clickedCoordinateIdRef = useRef(0);
  const copyFeedbackTimeoutRef = useRef<number | null>(null);
  const copyArrayFeedbackTimeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const tooltipPositionFrameRef = useRef<number | null>(null);
  const canHover = viewState.zoom >= SMALL_TO_MEDIUM_DOTS_ZOOM;

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

  const clickedPointScreenPositions = useMemo(() => {
    if (clickedCoordinates.length === 0 || !containerRef.current) {
      return null;
    }

    const { width, height } = containerRef.current.getBoundingClientRect();

    if (width === 0 || height === 0) {
      return null;
    }

    const viewport = new WebMercatorViewport({
      ...viewState,
      width,
      height,
    });
    return clickedCoordinates.map((coordinate) => {
      const [left, top] = viewport.project([coordinate.lon, coordinate.lat]);

      return {
        ...coordinate,
        left,
        top,
      };
    });
  }, [clickedCoordinates, viewState]);

  const polygonPrompt = useMemo(() => {
    const points = clickedCoordinates
      .map(
        (coordinate, index) =>
          `point ${index + 1}: { lat: ${coordinate.lat.toFixed(6)}, lon: ${coordinate.lon.toFixed(6)} }`,
      )
      .join(", ");

    return `create a new file in src/lib/neighborhoods/regions/ called {INSERT NAME} with a deck.gl polygon coordinate array based off the following lat/lon coords. add a badge variant in src/components/ui/badge.tsx for the neighborhood bucket (neighborhoodBadgeVariants). keep the same badge aesthetic, but use the color family from the region file's fillColor/lineColor. do not change the points i have provided unless absolutely necessary. follow other files in directory for pattern: \n [${points}]`;
  }, [clickedCoordinates]);
  const clickedCoordinatesTsArray = useMemo(() => {
    const points = clickedCoordinates
      .map((coordinate) => `  [${coordinate.lon}, ${coordinate.lat}],`)
      .join("\n");

    return `const coordinates = [\n${points}\n] as const;`;
  }, [clickedCoordinates]);

  const handleHover = (info: PickingInfo<CitiBikeStation>) => {
    const [lon, lat] = info.coordinate ?? [];

    setCursorCoordinates(
      typeof lat === "number" && typeof lon === "number" ? { lat, lon } : null,
    );

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

  const handleMapClick = (info: PickingInfo<CitiBikeStation>) => {
    const [lon, lat] = info.coordinate ?? [];

    if (typeof lat === "number" && typeof lon === "number") {
      setClickedCoordinates((current) => [
        ...current,
        {
          id: clickedCoordinateIdRef.current++,
          lat,
          lon,
        },
      ]);
    }

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

  const handleDeletePoint = (pointId: number) => {
    setClickedCoordinates((current) =>
      current.filter((coordinate) => coordinate.id !== pointId),
    );
  };

  const handleCopyPolygonPrompt = async () => {
    if (clickedCoordinates.length === 0) {
      return;
    }

    try {
      await navigator.clipboard.writeText(polygonPrompt);
      setCopyButtonLabel("Copied");
    } catch {
      setCopyButtonLabel("Copy Failed");
    }

    if (copyFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(copyFeedbackTimeoutRef.current);
    }

    copyFeedbackTimeoutRef.current = window.setTimeout(() => {
      setCopyButtonLabel("Copy GPT Prompt");
      copyFeedbackTimeoutRef.current = null;
    }, 2000);
  };

  const handleCopyCoordinatesTsArray = async () => {
    if (clickedCoordinates.length === 0) {
      return;
    }

    try {
      await navigator.clipboard.writeText(clickedCoordinatesTsArray);
      setCopyArrayButtonLabel("Copied");
    } catch {
      setCopyArrayButtonLabel("Copy Failed");
    }

    if (copyArrayFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(copyArrayFeedbackTimeoutRef.current);
    }

    copyArrayFeedbackTimeoutRef.current = window.setTimeout(() => {
      setCopyArrayButtonLabel("Copy TS Array");
      copyArrayFeedbackTimeoutRef.current = null;
    }, 2000);
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
      if (copyFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(copyFeedbackTimeoutRef.current);
      }
      if (copyArrayFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(copyArrayFeedbackTimeoutRef.current);
      }
    };
  }, []);

  const layers = useMemo(() => {
    const nextLayers: Layer[] = [];

    if (!citiBikeStations) {
      return nextLayers;
    }

    const layer = createStationPinsLayer(
      citiBikeStations.stations,
      viewState.zoom,
    );

    if (!layer) {
      return nextLayers;
    }

    nextLayers.push(...(Array.isArray(layer) ? layer : [layer]));

    if (isNeighborhoodsVisible) {
      nextLayers.push(
        ...createNeighborhoodPolygonsLayer({
          showLabels: viewState.zoom >= 13,
        }),
      );
    }

    return nextLayers;
  }, [citiBikeStations, isNeighborhoodsVisible, viewState.zoom]);

  return (
    <div className="relative size-full" ref={containerRef}>
      <DeckGL
        controller
        getCursor={({ isDragging, isHovering }: CursorState) =>
          isDragging ? "grabbing" : canHover && isHovering ? "pointer" : "grab"
        }
        layers={layers}
        onClick={handleMapClick}
        onDragStart={() => {
          if (!isMobile) {
            clearHoveredStation();
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

      <div className="absolute top-4 left-4">
        <NeighborhoodToggle
          isVisible={isNeighborhoodsVisible}
          onVisibilityChange={setIsNeighborhoodsVisible}
        />
      </div>

      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
        <div className="rounded-md border border-white/10 bg-black/70 px-3 py-2 font-mono text-[11px] text-white shadow-lg backdrop-blur-sm">
          <div>lat: {cursorCoordinates?.lat.toFixed(6) ?? "--"}</div>
          <div>lon: {cursorCoordinates?.lon.toFixed(6) ?? "--"}</div>
          <div>zoom: {viewState.zoom.toFixed(2) ?? "--"}</div>
        </div>
        <button
          className="pointer-events-auto rounded-md border border-cyan-300/35 bg-slate-950/90 px-3 py-2 font-mono text-[11px] text-cyan-100 shadow-lg transition hover:border-cyan-200/60 hover:text-cyan-50 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={clickedCoordinates.length === 0}
          onClick={handleCopyPolygonPrompt}
          type="button"
        >
          {copyButtonLabel}
        </button>
        <button
          className="pointer-events-auto rounded-md border border-cyan-300/35 bg-slate-950/90 px-3 py-2 font-mono text-[11px] text-cyan-100 shadow-lg transition hover:border-cyan-200/60 hover:text-cyan-50 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={clickedCoordinates.length === 0}
          onClick={handleCopyCoordinatesTsArray}
          type="button"
        >
          {copyArrayButtonLabel}
        </button>
        <button
          className="pointer-events-auto rounded-md border border-cyan-300/35 bg-slate-950/90 px-3 py-2 font-mono text-[11px] text-cyan-100 shadow-lg transition hover:border-cyan-200/60 hover:text-cyan-50 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => setClickedCoordinates([])}
          type="button"
          disabled={clickedCoordinates.length === 0}
        >
          Clear
        </button>
      </div>

      {clickedPointScreenPositions?.map((coordinate, index) => (
        <div
          className="absolute z-20"
          key={coordinate.id}
          style={{
            left: coordinate.left,
            top: coordinate.top,
            transform: "translate(-50%, -50%)",
          }}
        >
          <button
            className="flex size-5 cursor-pointer items-center justify-center rounded-full border border-cyan-300/60 bg-slate-950/80 font-mono text-[9px] text-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-colors hover:border-red-400/80 hover:bg-red-950/80 hover:text-red-200 hover:shadow-[0_0_10px_rgba(248,113,113,0.5)]"
            onClick={(e) => {
              e.stopPropagation();
              handleDeletePoint(coordinate.id);
            }}
            type="button"
          >
            {index + 1}
          </button>
        </div>
      ))}

      {hoveredStation ? (
        <div
          className="pointer-events-none absolute z-20 hidden md:block"
          ref={(node) => {
            tooltipRef.current = node;

            if (node && hoveredStation) {
              scheduleTooltipPosition(hoveredStation.station, viewState);
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
          <StationTooltip station={hoveredStation.station} />
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
