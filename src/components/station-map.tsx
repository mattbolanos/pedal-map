import {
  FlyToInterpolator,
  type Layer,
  type MapViewState,
  type PickingInfo,
  WebMercatorViewport,
} from "@deck.gl/core";
import { DeckGL } from "@deck.gl/react";
import { useQuery } from "@tanstack/react-query";
import type { LngLatBoundsLike } from "mapbox-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Map as MapView } from "react-map-gl/mapbox";
import {
  createStationPinsLayer,
  SMALL_TO_MEDIUM_DOTS_ZOOM,
} from "#/components/station-pins-layer";
import {
  StationDrawer,
  StationPopoverPanel,
  StationTooltip,
} from "#/components/station-tooltip";
import { Drawer } from "#/components/ui/drawer";
import { useIsMobile } from "#/hooks/use-mobile";
import { usePrefersReducedMotion } from "#/hooks/use-reduced-motion";
import type { CitiBikeStation } from "#/lib/citibike";
import { citiBikeStationsQueryOptions } from "#/lib/citibike";
import { MapControls } from "./map-controls";
import { MapSummary } from "./map-summary";

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
const MAX_ZOOM = 16;
const STATION_HIT_AREA = 12;
const DESKTOP_HOVER_LEAVE_DELAY_MS = 100;
const TOOLTIP_GAP = 18;
const TOOLTIP_VIEWPORT_PADDING = 20;
const SELECTED_DESKTOP_PANEL_GAP = 16;
const DESKTOP_SELECTED_STATION_X_RATIO = 0.5;
const DESKTOP_SELECTED_STATION_Y_RATIO = 0.62;
const MOBILE_SELECTED_STATION_Y_RATIO = 0.3;

const STATION_FLY_TO_INTERPOLATOR = new FlyToInterpolator({ curve: 1.25 });
const STATION_FLY_TO_DURATION_MS = 1050;

const easeOutQuint = (value: number) => 1 - (1 - value) ** 5;

interface HoveredStation {
  station: CitiBikeStation;
}

interface TooltipPosition {
  left: number;
  top: number;
}

interface ProjectedStationPosition {
  anchorX: number;
  anchorY: number;
  containerRect: DOMRect;
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
  const renderStationsRef = useRef<CitiBikeStation[]>([]);
  const [viewState, setViewState] = useState(() =>
    clampViewState(INITIAL_VIEW_STATE),
  );
  const [hoveredStation, setHoveredStation] = useState<HoveredStation | null>(
    null,
  );
  const [searchSelectedDesktopStation, setSearchSelectedDesktopStation] =
    useState<HoveredStation | null>(null);
  const [selectedMobileStation, setSelectedMobileStation] =
    useState<HoveredStation | null>(null);
  const [mobileDrawerStation, setMobileDrawerStation] =
    useState<HoveredStation | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  const [tooltipPosition, setTooltipPosition] =
    useState<TooltipPosition | null>(null);
  const hoveredStationIdRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const tooltipPositionFrameRef = useRef<number | null>(null);
  const hoverLeaveTimeoutRef = useRef<number | null>(null);
  const canHover = viewState.zoom >= SMALL_TO_MEDIUM_DOTS_ZOOM;
  const prefersReducedMotion = usePrefersReducedMotion();
  const renderStations =
    stations.length > 0 ? stations : renderStationsRef.current;

  useEffect(() => {
    if (stations.length > 0) {
      renderStationsRef.current = stations;
    }
  }, [stations]);

  const clearHoverTimers = useCallback(() => {
    if (hoverLeaveTimeoutRef.current !== null) {
      window.clearTimeout(hoverLeaveTimeoutRef.current);
      hoverLeaveTimeoutRef.current = null;
    }
  }, []);

  const clearHoveredStation = useCallback(() => {
    if (tooltipPositionFrameRef.current !== null) {
      cancelAnimationFrame(tooltipPositionFrameRef.current);
      tooltipPositionFrameRef.current = null;
    }

    clearHoverTimers();

    if (hoveredStationIdRef.current !== null) {
      hoveredStationIdRef.current = null;
      setHoveredStation(null);
      setTooltipPosition(null);
    }
  }, [clearHoverTimers]);

  const projectStationPosition = useCallback(
    (
      station: CitiBikeStation,
      nextViewState: MapViewState,
    ): ProjectedStationPosition | null => {
      if (!containerRef.current) {
        return null;
      }

      const containerRect = containerRef.current.getBoundingClientRect();

      if (containerRect.width === 0 || containerRect.height === 0) {
        return null;
      }

      const viewport = new WebMercatorViewport({
        ...nextViewState,
        width: containerRect.width,
        height: containerRect.height,
      });
      const [anchorX, anchorY] = viewport.project([station.lon, station.lat]);

      return {
        anchorX,
        anchorY,
        containerRect,
      };
    },
    [],
  );

  const updateTooltipPosition = useCallback(
    (station: CitiBikeStation, nextViewState: MapViewState) => {
      if (!tooltipRef.current) {
        setTooltipPosition(null);
        return;
      }

      const projectedPosition = projectStationPosition(station, nextViewState);

      if (!projectedPosition) {
        setTooltipPosition(null);
        return;
      }

      const { anchorX, anchorY, containerRect } = projectedPosition;
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      if (tooltipRect.width === 0 || tooltipRect.height === 0) {
        setTooltipPosition(null);
        return;
      }

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
    },
    [projectStationPosition],
  );

  const scheduleTooltipPosition = useCallback(
    (station: CitiBikeStation, nextViewState: MapViewState) => {
      if (tooltipPositionFrameRef.current !== null) {
        cancelAnimationFrame(tooltipPositionFrameRef.current);
      }

      tooltipPositionFrameRef.current = requestAnimationFrame(() => {
        tooltipPositionFrameRef.current = null;
        updateTooltipPosition(station, nextViewState);
      });
    },
    [updateTooltipPosition],
  );

  const setHoveredStationState = useCallback(
    (station: CitiBikeStation) => {
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
    },
    [scheduleTooltipPosition, viewState],
  );

  const scheduleHoverClear = useCallback(() => {
    if (
      hoveredStationIdRef.current === null ||
      hoverLeaveTimeoutRef.current !== null
    ) {
      return;
    }

    hoverLeaveTimeoutRef.current = window.setTimeout(() => {
      hoverLeaveTimeoutRef.current = null;
      clearHoveredStation();
    }, DESKTOP_HOVER_LEAVE_DELAY_MS);
  }, [clearHoveredStation]);

  const scheduleHoveredStation = useCallback(
    (station: CitiBikeStation) => {
      if (hoverLeaveTimeoutRef.current !== null) {
        window.clearTimeout(hoverLeaveTimeoutRef.current);
        hoverLeaveTimeoutRef.current = null;
      }

      if (hoveredStationIdRef.current !== station.station_id) {
        setHoveredStationState(station);
        return;
      }

      setHoveredStationState(station);
    },
    [setHoveredStationState],
  );

  const alignStationInViewport = useCallback(
    (station: CitiBikeStation, nextViewState: MapViewState) => {
      if (!containerRef.current) {
        return nextViewState;
      }

      const { width, height } = containerRef.current.getBoundingClientRect();

      if (width === 0 || height === 0) {
        return nextViewState;
      }

      const viewport = new WebMercatorViewport({
        ...nextViewState,
        width,
        height,
      });

      // Use different y ratios for mobile and desktop, integrating MOBILE_SELECTED_STATION_Y_RATIO
      const yRatio = isMobile
        ? MOBILE_SELECTED_STATION_Y_RATIO
        : DESKTOP_SELECTED_STATION_Y_RATIO;
      const xRatio = DESKTOP_SELECTED_STATION_X_RATIO; // Both can share x

      const desiredPixel: [number, number] = [width * xRatio, height * yRatio];

      return clampViewState({
        ...nextViewState,
        ...viewport.panByPosition([station.lon, station.lat], desiredPixel),
      });
    },
    [isMobile],
  );

  const handleHover = (info: PickingInfo<CitiBikeStation>) => {
    if (!canHover || isMobile) {
      return;
    }

    const station = info.object;

    if (!station) {
      scheduleHoverClear();
      return;
    }

    scheduleHoveredStation(station);
  };

  const selectStationFromSearch = (station: CitiBikeStation) => {
    const nextViewState = clampViewState({
      ...viewState,
      longitude: station.lon,
      latitude: station.lat,
      zoom: MAX_ZOOM,
      transitionDuration: prefersReducedMotion ? 0 : STATION_FLY_TO_DURATION_MS,
      transitionEasing: prefersReducedMotion ? undefined : easeOutQuint,
      transitionInterpolator: prefersReducedMotion
        ? undefined
        : STATION_FLY_TO_INTERPOLATOR,
    });
    const focusedViewState = alignStationInViewport(station, nextViewState);

    setViewState(focusedViewState);

    if (isMobile) {
      clearHoveredStation();
      setSearchSelectedDesktopStation(null);
      const nextStationState = toStationState(station);
      setSelectedMobileStation(nextStationState);
      setMobileDrawerStation(nextStationState);
      setIsMobileDrawerOpen(true);
      return;
    }

    clearHoveredStation();
    setSearchSelectedDesktopStation(toStationState(station));
  };

  const handleMapClick = (info: PickingInfo<CitiBikeStation>) => {
    const station = info.object;

    if (isMobile) {
      if (!station) {
        clearHoveredStation();
        return;
      }

      hoveredStationIdRef.current = station.station_id;
      setIsMobileDrawerOpen(true);
      setSelectedMobileStation((current) => {
        if (current?.station === station) {
          return current;
        }

        return {
          station,
        };
      });
      setMobileDrawerStation((current) => {
        if (current?.station === station) {
          return current;
        }

        return {
          station,
        };
      });
      return;
    }

    if (!station) {
      setSearchSelectedDesktopStation(null);
      return;
    }
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
    if (isMobile || !hoveredStation) {
      return;
    }

    scheduleTooltipPosition(hoveredStation.station, viewState);
  }, [hoveredStation, isMobile, scheduleTooltipPosition, viewState]);

  useEffect(() => {
    return () => {
      if (tooltipPositionFrameRef.current !== null) {
        cancelAnimationFrame(tooltipPositionFrameRef.current);
      }

      clearHoverTimers();
    };
  }, [clearHoverTimers]);

  const selectedStationIds = useMemo(() => {
    const ids = new Set<string>();

    if (hoveredStation) {
      ids.add(hoveredStation.station.station_id);
    }

    if (searchSelectedDesktopStation) {
      ids.add(searchSelectedDesktopStation.station.station_id);
    }

    if (selectedMobileStation) {
      ids.add(selectedMobileStation.station.station_id);
    }

    return [...ids];
  }, [hoveredStation, searchSelectedDesktopStation, selectedMobileStation]);

  const layers = useMemo(() => {
    const nextLayers: Layer[] = [];

    if (renderStations.length === 0) {
      return nextLayers;
    }

    const layer = createStationPinsLayer(
      renderStations,
      viewState.zoom,
      selectedStationIds,
    );

    if (!layer) {
      return nextLayers;
    }

    nextLayers.push(...(Array.isArray(layer) ? layer : [layer]));

    return nextLayers;
  }, [renderStations, selectedStationIds, viewState.zoom]);

  const selectedDesktopPanelTop = useMemo(() => {
    if (!searchSelectedDesktopStation || isMobile) {
      return null;
    }

    const projectedPosition = projectStationPosition(
      searchSelectedDesktopStation.station,
      viewState,
    );

    if (projectedPosition) {
      return clamp(
        projectedPosition.anchorY,
        TOOLTIP_VIEWPORT_PADDING + SELECTED_DESKTOP_PANEL_GAP,
        projectedPosition.containerRect.height - TOOLTIP_VIEWPORT_PADDING,
      );
    }

    if (!containerRef.current) {
      return null;
    }

    const { height } = containerRef.current.getBoundingClientRect();

    if (height === 0) {
      return null;
    }

    return height * DESKTOP_SELECTED_STATION_Y_RATIO;
  }, [
    isMobile,
    projectStationPosition,
    searchSelectedDesktopStation,
    viewState,
  ]);

  return (
    <div className="relative size-full" ref={containerRef}>
      <MapControls
        stations={renderStations}
        lastUpdated={citiBikeStations?.lastUpdated}
        onSelectStation={selectStationFromSearch}
      />
      <MapSummary
        className="hidden md:block"
        stations={renderStations}
        lastUpdated={citiBikeStations?.lastUpdated}
      />
      <DeckGL
        controller
        getCursor={({ isDragging }) => (isDragging ? "grabbing" : "grab")}
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

      {hoveredStation ? (
        <div
          className="pointer-events-none absolute top-0 left-0 z-20 hidden will-change-transform md:block"
          ref={(node) => {
            tooltipRef.current = node;

            if (node && hoveredStation) {
              scheduleTooltipPosition(hoveredStation.station, viewState);
            }
          }}
          style={
            tooltipPosition
              ? {
                  transform: `translate3d(${tooltipPosition.left}px, ${tooltipPosition.top}px, 0)`,
                }
              : {
                  transform: "translate3d(0, 0, 0)",
                  visibility: "hidden",
                }
          }
        >
          <StationTooltip station={hoveredStation.station} />
        </div>
      ) : null}

      {!isMobile && searchSelectedDesktopStation ? (
        <div
          className="pointer-events-none absolute left-1/2 z-30 hidden md:block"
          style={{
            top: selectedDesktopPanelTop ?? "62%",
            transform: `translate3d(-50%, calc(-100% - ${SELECTED_DESKTOP_PANEL_GAP}px), 0)`,
          }}
        >
          <div className="bg-popover text-popover-foreground supports-backdrop-filter:bg-popover/95 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 motion-safe:zoom-in-95 pointer-events-auto flex w-72 origin-top flex-col gap-4 rounded-2xl p-4 text-sm shadow-2xl ring-1 ring-black/10 outline-hidden motion-safe:duration-150">
            <StationPopoverPanel
              station={searchSelectedDesktopStation.station}
              onClose={() => {
                setSearchSelectedDesktopStation(null);
              }}
            />
          </div>
        </div>
      ) : null}

      <Drawer
        open={isMobile && isMobileDrawerOpen}
        noBodyStyles={true}
        modal={false}
        setBackgroundColorOnScale={false}
        onOpenChange={(open) => {
          setIsMobileDrawerOpen(open);

          if (!open) {
            setSelectedMobileStation(null);
          }
        }}
        onAnimationEnd={(open) => {
          if (!open) {
            setMobileDrawerStation(null);
          }
        }}
      >
        {isMobile && mobileDrawerStation ? (
          <StationDrawer station={mobileDrawerStation.station} />
        ) : null}
      </Drawer>
    </div>
  );
}
