import type { MapViewState } from "@deck.gl/core";
import { useCallback } from "react";
import type { CitiBikeStation } from "#/lib/citibike";
import type { TooltipPosition } from "./station-map.types";
import {
  StationDrawer,
  StationPopoverPanel,
  StationTooltip,
} from "./station-tooltip";
import { Drawer } from "./ui/drawer";

interface HoveredStationTooltipOverlayProps {
  onTooltipPointerEnter: () => void;
  onTooltipPointerLeave: () => void;
  station: CitiBikeStation;
  tooltipPosition: TooltipPosition | null;
  tooltipRef: (node: HTMLDivElement | null) => void;
  scheduleTooltipPosition: (
    station: CitiBikeStation,
    viewState: MapViewState,
  ) => void;
  viewState: MapViewState;
}

interface SelectedDesktopStationPopoverOverlayProps {
  station: CitiBikeStation;
  top: number | null;
  onClose: () => void;
}

interface MobileStationDrawerOverlayProps {
  open: boolean;
  station: CitiBikeStation | null;
  onOpenChange: (open: boolean) => void;
  onAnimationEnd: (open: boolean) => void;
}

export function HoveredStationTooltipOverlay({
  onTooltipPointerEnter,
  onTooltipPointerLeave,
  scheduleTooltipPosition,
  station,
  tooltipPosition,
  tooltipRef,
  viewState,
}: HoveredStationTooltipOverlayProps) {
  const handleRef = useCallback(
    (node: HTMLDivElement | null) => {
      tooltipRef(node);

      if (node) {
        scheduleTooltipPosition(station, viewState);
      }
    },
    [scheduleTooltipPosition, station, tooltipRef, viewState],
  );

  return (
    <div
      className="pointer-events-none absolute top-0 left-0 z-20 hidden will-change-transform md:block"
      ref={handleRef}
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
      <div
        className="pointer-events-auto"
        onPointerEnter={onTooltipPointerEnter}
        onPointerLeave={onTooltipPointerLeave}
      >
        <StationTooltip station={station} />
      </div>
    </div>
  );
}

export function SelectedDesktopStationPopoverOverlay({
  onClose,
  station,
  top,
}: SelectedDesktopStationPopoverOverlayProps) {
  return (
    <div
      className="pointer-events-none absolute left-1/2 z-30 hidden md:block"
      style={{
        top: top ?? "62%",
        transform: "translate3d(-50%, calc(-100% - 16px), 0)",
      }}
    >
      <div className="bg-popover text-popover-foreground supports-backdrop-filter:bg-popover/95 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 motion-safe:zoom-in-95 pointer-events-auto flex w-72 origin-top flex-col gap-4 rounded-2xl p-4 text-sm shadow-2xl ring-1 ring-black/10 outline-hidden motion-safe:duration-150">
        <StationPopoverPanel station={station} onClose={onClose} />
      </div>
    </div>
  );
}

export function MobileStationDrawerOverlay({
  onAnimationEnd,
  onOpenChange,
  open,
  station,
}: MobileStationDrawerOverlayProps) {
  return (
    <Drawer
      open={open}
      noBodyStyles={true}
      modal={false}
      setBackgroundColorOnScale={false}
      onOpenChange={onOpenChange}
      onAnimationEnd={onAnimationEnd}
    >
      {station ? <StationDrawer station={station} /> : null}
    </Drawer>
  );
}
