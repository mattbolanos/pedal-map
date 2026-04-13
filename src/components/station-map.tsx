import {
  type Layer,
  type MapViewState,
  type PickingInfo,
  WebMercatorViewport,
} from "@deck.gl/core";
import { DeckGL } from "@deck.gl/react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Map as MapView } from "react-map-gl/mapbox";
import { toast } from "sonner";
import {
  HoveredStationTooltipOverlay,
  MobileStationDrawerOverlay,
  SelectedDesktopStationPopoverOverlay,
  type TooltipPosition,
} from "#/components/station-map-overlays";
import {
  clamp,
  clampViewState,
  createStationFlyToViewState,
  createUserLocationFlyToViewState,
  MAX_ZOOM,
  MIN_ZOOM,
} from "#/components/station-map-view-state";
import {
  createStationPinsLayer,
  createUserLocationLayer,
  SMALL_TO_MEDIUM_DOTS_ZOOM,
} from "#/components/station-pins-layer";
import { useIsMobile } from "#/hooks/use-mobile";
import { usePrefersReducedMotion } from "#/hooks/use-reduced-motion";
import type { CitiBikeStation } from "#/lib/citibike";
import { citiBikeStationsQueryOptions } from "#/lib/citibike";
import { NYC_METRO_BOUNDS } from "#/lib/geo";
import {
  getUserLocationToast,
  hasActiveUserLocation,
  INITIAL_USER_LOCATION_STATE,
  requestCurrentUserLocation,
  type UserLocationState,
} from "#/lib/user-location";
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

const STATION_HIT_AREA = 12;
const DESKTOP_HOVER_LEAVE_DELAY_MS = 100;
const TOOLTIP_GAP = 18;
const TOOLTIP_VIEWPORT_PADDING = 20;
const SELECTED_DESKTOP_PANEL_GAP = 16;
const DESKTOP_SELECTED_STATION_X_RATIO = 0.5;
const DESKTOP_SELECTED_STATION_Y_RATIO = 0.62;
const MOBILE_SELECTED_STATION_Y_RATIO = 0.3;
const USER_LOCATION_TOAST_ID = "user-location-status";

interface HoveredStation {
  station: CitiBikeStation;
}

interface ProjectedStationPosition {
  anchorX: number;
  anchorY: number;
  containerRect: DOMRect;
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
  const locationRequestIdRef = useRef(0);
  const canHover = viewState.zoom >= SMALL_TO_MEDIUM_DOTS_ZOOM;
  const prefersReducedMotion = usePrefersReducedMotion();
  const [userLocation, setUserLocation] = useState<UserLocationState>(
    INITIAL_USER_LOCATION_STATE,
  );
  const renderStations =
    stations.length > 0 ? stations : renderStationsRef.current;
  const activeUserCoordinates = hasActiveUserLocation(userLocation)
    ? userLocation.coords
    : null;

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

  const setTooltipRef = useCallback(
    (node: HTMLDivElement | null) => {
      tooltipRef.current = node;

      if (node && hoveredStation) {
        scheduleTooltipPosition(hoveredStation.station, viewState);
      }
    },
    [hoveredStation, scheduleTooltipPosition, viewState],
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

  const requestUserLocation = useCallback(async () => {
    const requestId = locationRequestIdRef.current + 1;
    locationRequestIdRef.current = requestId;

    setUserLocation((current) => ({
      ...current,
      errorMessage: undefined,
      status: "requesting",
    }));

    const nextUserLocation = await requestCurrentUserLocation(
      typeof navigator === "undefined" ? undefined : navigator.geolocation,
    );

    if (locationRequestIdRef.current !== requestId) {
      return;
    }

    setUserLocation(nextUserLocation);

    if (hasActiveUserLocation(nextUserLocation) && nextUserLocation.coords) {
      toast.dismiss(USER_LOCATION_TOAST_ID);
      clearHoveredStation();
      setSearchSelectedDesktopStation(null);
      setSelectedMobileStation(null);
      setMobileDrawerStation(null);
      setIsMobileDrawerOpen(false);
      setViewState((currentViewState) =>
        clampViewState(
          createUserLocationFlyToViewState(
            currentViewState,
            nextUserLocation.coords ?? { lon: 0, lat: 0 },
            prefersReducedMotion,
          ),
        ),
      );
    }

    const locationToast = getUserLocationToast(nextUserLocation);

    if (!locationToast) {
      return;
    }

    const showToast =
      locationToast.variant === "warning" ? toast.warning : toast.error;

    showToast(locationToast.title, {
      description: locationToast.description,
      id: USER_LOCATION_TOAST_ID,
    });
  }, [clearHoveredStation, prefersReducedMotion]);

  const clearUserLocation = useCallback(() => {
    locationRequestIdRef.current += 1;
    toast.dismiss(USER_LOCATION_TOAST_ID);
    setUserLocation(INITIAL_USER_LOCATION_STATE);
  }, []);

  const selectStationFromSearch = (station: CitiBikeStation) => {
    setViewState((currentViewState) => {
      const nextViewState = clampViewState(
        createStationFlyToViewState(
          currentViewState,
          station,
          prefersReducedMotion,
        ),
      );

      return alignStationInViewport(station, nextViewState);
    });

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

  const userLocationLayers = useMemo(
    () => createUserLocationLayer(activeUserCoordinates),
    [activeUserCoordinates],
  );

  const layers = useMemo(() => {
    const nextLayers: Layer[] = [];

    if (renderStations.length > 0) {
      const layer = createStationPinsLayer(
        renderStations,
        viewState.zoom,
        selectedStationIds,
      );

      if (layer) {
        nextLayers.push(...(Array.isArray(layer) ? layer : [layer]));
      }
    }

    if (userLocationLayers) {
      nextLayers.push(...userLocationLayers);
    }

    return nextLayers;
  }, [renderStations, selectedStationIds, userLocationLayers, viewState.zoom]);

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
        onClearUserLocation={clearUserLocation}
        onSelectStation={selectStationFromSearch}
        onRequestUserLocation={requestUserLocation}
        userLocation={userLocation}
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
        <HoveredStationTooltipOverlay
          station={hoveredStation.station}
          tooltipPosition={tooltipPosition}
          tooltipRef={setTooltipRef}
          scheduleTooltipPosition={scheduleTooltipPosition}
          viewState={viewState}
        />
      ) : null}

      {!isMobile && searchSelectedDesktopStation ? (
        <SelectedDesktopStationPopoverOverlay
          station={searchSelectedDesktopStation.station}
          top={selectedDesktopPanelTop}
          onClose={() => {
            setSearchSelectedDesktopStation(null);
          }}
        />
      ) : null}

      <MobileStationDrawerOverlay
        open={isMobile && isMobileDrawerOpen}
        station={isMobile ? (mobileDrawerStation?.station ?? null) : null}
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
      />
    </div>
  );
}
