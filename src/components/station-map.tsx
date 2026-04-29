import {
  type MapViewState,
  type PickingInfo,
  WebMercatorViewport,
} from "@deck.gl/core";
import { DeckGL } from "@deck.gl/react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { Map as MapView } from "react-map-gl/mapbox";
import { toast } from "sonner";
import {
  HoveredStationTooltipOverlay,
  MobileStationDrawerOverlay,
  SelectedDesktopStationPopoverOverlay,
} from "#/components/station-map-overlays";
import {
  clamp,
  clampViewState,
  createStationFlyToViewState,
  createUserLocationFlyToViewState,
  MAX_ZOOM,
  MIN_ZOOM,
} from "#/components/station-map-view-state";
import { useIsMobile } from "#/hooks/use-mobile";
import { usePrefersReducedMotion } from "#/hooks/use-reduced-motion";
import type { CitiBikeStation } from "#/lib/citibike";
import { citiBikeStationsQueryOptions } from "#/lib/citibike";
import { NYC_METRO_BOUNDS } from "#/lib/geo";
import {
  DESKTOP_SELECTED_STATION_X_RATIO,
  DESKTOP_SELECTED_STATION_Y_RATIO,
  INITIAL_VIEW_STATE,
  MAP_STYLE_URL,
  MAPBOX_ACCESS_TOKEN,
  MOBILE_SELECTED_STATION_Y_RATIO,
  SELECTED_DESKTOP_PANEL_GAP,
  STATION_HIT_AREA,
  TOOLTIP_VIEWPORT_PADDING,
  USER_LOCATION_TOAST_ID,
} from "#/lib/station-map";
import {
  getUserLocationToast,
  hasActiveUserLocation,
  INITIAL_USER_LOCATION_STATE,
  requestCurrentUserLocation,
  type UserLocationState,
} from "#/lib/user-location";
import { MapControls } from "./map-controls";
import { MapSummary } from "./map-summary";
import type { HoveredStation } from "./station-map.types";
import { useStationMapLayers } from "./use-station-map-layers";
import { useStationMapTooltip } from "./use-station-map-tooltip";

export function StationMap() {
  const { data: citiBikeStations } = useQuery(citiBikeStationsQueryOptions);
  const stations = citiBikeStations?.stations ?? [];
  const renderStationsRef = useRef<CitiBikeStation[]>([]);
  const [viewState, setViewState] = useState(() =>
    clampViewState(INITIAL_VIEW_STATE),
  );
  const [searchSelectedDesktopStation, setSearchSelectedDesktopStation] =
    useState<HoveredStation | null>(null);
  const [selectedMobileStation, setSelectedMobileStation] =
    useState<HoveredStation | null>(null);
  const [mobileDrawerStation, setMobileDrawerStation] =
    useState<HoveredStation | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  const locationRequestIdRef = useRef(0);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [userLocation, setUserLocation] = useState<UserLocationState>(
    INITIAL_USER_LOCATION_STATE,
  );
  const renderStations =
    stations.length > 0 ? stations : renderStationsRef.current;
  const activeUserCoordinates = hasActiveUserLocation(userLocation)
    ? userLocation.coords
    : null;
  const {
    clearHoveredStation,
    containerRef,
    handleHover,
    handleTooltipPointerEnter,
    handleTooltipPointerLeave,
    hoveredStation,
    markStationInteraction,
    projectStationPosition,
    scheduleTooltipPosition,
    setTooltipRef,
    tooltipPosition,
  } = useStationMapTooltip({
    isMobile,
    viewState,
  });

  const alignStationInViewport = (
    station: CitiBikeStation,
    nextViewState: MapViewState,
  ) => {
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
      const nextStationState = { station };
      setSelectedMobileStation(nextStationState);
      setMobileDrawerStation(nextStationState);
      setIsMobileDrawerOpen(true);
      return;
    }

    clearHoveredStation();
    setSearchSelectedDesktopStation({ station });
  };

  const handleMapClick = (info: PickingInfo<CitiBikeStation>) => {
    const station = info.object;

    if (isMobile) {
      if (!station) {
        clearHoveredStation();
        return;
      }

      markStationInteraction(station.station_id);
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

  const layers = useStationMapLayers({
    activeUserCoordinates,
    hoveredStation,
    renderStations,
    searchSelectedDesktopStation,
    selectedMobileStation,
    zoom: viewState.zoom,
  });

  const selectedDesktopPanelTop = (() => {
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
  })();

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
        controller={{
          touchRotate: true,
        }}
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
          onTooltipPointerEnter={handleTooltipPointerEnter}
          onTooltipPointerLeave={handleTooltipPointerLeave}
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
