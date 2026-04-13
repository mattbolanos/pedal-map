import type { Layer } from "@deck.gl/core";
import { useMemo } from "react";
import {
  createStationPinsLayer,
  createUserLocationLayer,
} from "#/components/station-pins-layer";
import type { CitiBikeStation } from "#/lib/citibike";
import type { GeoCoordinates } from "#/lib/geo";
import type { HoveredStation } from "./station-map.types";

interface UseStationMapLayersOptions {
  activeUserCoordinates: GeoCoordinates | null;
  hoveredStation: HoveredStation | null;
  renderStations: CitiBikeStation[];
  searchSelectedDesktopStation: HoveredStation | null;
  selectedMobileStation: HoveredStation | null;
  zoom: number;
}

export function useStationMapLayers({
  activeUserCoordinates,
  hoveredStation,
  renderStations,
  searchSelectedDesktopStation,
  selectedMobileStation,
  zoom,
}: UseStationMapLayersOptions) {
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

  return useMemo(() => {
    const nextLayers: Layer[] = [];

    if (renderStations.length > 0) {
      const layer = createStationPinsLayer(
        renderStations,
        zoom,
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
  }, [renderStations, selectedStationIds, userLocationLayers, zoom]);
}
