import {
	type MapViewState,
	type PickingInfo,
	WebMercatorViewport,
} from "@deck.gl/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { clamp } from "#/components/station-map-view-state";
import { SMALL_TO_MEDIUM_DOTS_ZOOM } from "#/components/station-pins-layer";
import type { CitiBikeStation } from "#/lib/citibike";
import {
	DESKTOP_HOVER_LEAVE_DELAY_MS,
	TOOLTIP_GAP,
	TOOLTIP_VIEWPORT_PADDING,
} from "./station-map.constants";
import type { HoveredStation, TooltipPosition } from "./station-map.types";

interface ProjectedStationPosition {
	anchorX: number;
	anchorY: number;
	containerRect: DOMRect;
}

interface UseStationMapTooltipOptions {
	isMobile: boolean;
	viewState: MapViewState;
}

export function useStationMapTooltip({
	isMobile,
	viewState,
}: UseStationMapTooltipOptions) {
	const [hoveredStation, setHoveredStation] = useState<HoveredStation | null>(
		null,
	);
	const [tooltipPosition, setTooltipPosition] =
		useState<TooltipPosition | null>(null);
	const hoveredStationIdRef = useRef<string | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const tooltipRef = useRef<HTMLDivElement | null>(null);
	const tooltipPositionFrameRef = useRef<number | null>(null);
	const hoverLeaveTimeoutRef = useRef<number | null>(null);
	const canHover = viewState.zoom >= SMALL_TO_MEDIUM_DOTS_ZOOM;

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

				return { station };
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

	const handleHover = useCallback(
		(info: PickingInfo<CitiBikeStation>) => {
			if (!canHover || isMobile) {
				return;
			}

			const station = info.object;

			if (!station) {
				scheduleHoverClear();
				return;
			}

			scheduleHoveredStation(station);
		},
		[canHover, isMobile, scheduleHoverClear, scheduleHoveredStation],
	);

	const markStationInteraction = useCallback((stationId: string | null) => {
		hoveredStationIdRef.current = stationId;
	}, []);

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

	return {
		clearHoveredStation,
		containerRef,
		handleHover,
		hoveredStation,
		markStationInteraction,
		projectStationPosition,
		scheduleTooltipPosition,
		setTooltipRef,
		tooltipPosition,
	};
}
