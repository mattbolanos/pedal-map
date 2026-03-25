import { MapPin } from "@phosphor-icons/react";
import { memo, useMemo } from "react";
import type { CitiBikeStation } from "#/lib/citibike";
import { cn } from "#/lib/utils";

const STATUS_COLORS = {
  /** ≥ 50 % — pale steel. Moonlight on water. */
  healthy: {
    accent: "#94b4d4",
    glowInner: "rgba(148, 180, 212, 0.65)",
    glowOuter: "rgba(148, 180, 212, 0.22)",
  },
  /** 25–50 % — grey teal. Cool, muted, still calm. */
  moderate: {
    accent: "#7aa3b0",
    glowInner: "rgba(122, 163, 176, 0.55)",
    glowOuter: "rgba(122, 163, 176, 0.18)",
  },
  /** 1–24 % — aged brass. Warm but restrained. */
  low: {
    accent: "#c4a054",
    glowInner: "rgba(196, 160, 84, 0.55)",
    glowOuter: "rgba(196, 160, 84, 0.18)",
  },
  /** 0 % — dusty wine. Quiet urgency. */
  empty: {
    accent: "#b07278",
    glowInner: "rgba(176, 114, 120, 0.50)",
    glowOuter: "rgba(176, 114, 120, 0.16)",
  },
  /** Offline — map-colored. Nearly invisible. */
  offline: {
    accent: "#384558",
    glowInner: "rgba(56, 69, 88, 0.15)",
    glowOuter: "rgba(56, 69, 88, 0.04)",
  },
} as const;

function getAvailabilityRatio(station: CitiBikeStation): number {
  const bikes = station.num_bikes_available ?? 0;
  const docks = station.num_docks_available ?? 0;
  const total = bikes + docks;
  if (total === 0) return 0;
  return bikes / total;
}

function getStatusColors(ratio: number, isActive: boolean) {
  if (!isActive) return STATUS_COLORS.offline;
  if (ratio === 0) return STATUS_COLORS.empty;
  if (ratio < 0.25) return STATUS_COLORS.low;
  if (ratio < 0.5) return STATUS_COLORS.moderate;
  return STATUS_COLORS.healthy;
}

function isStationActive(station: CitiBikeStation): boolean {
  return station.is_renting === 1 && station.is_installed === 1;
}

function buildGlowFilter(glowInner: string, glowOuter: string): string {
  return [
    `drop-shadow(0 0 1px ${glowInner})`,
    `drop-shadow(0 0 3px ${glowInner})`,
    `drop-shadow(0 0 7px ${glowOuter})`,
  ].join(" ");
}

interface StationPinProps {
  station: CitiBikeStation;
}

function areStationPinPropsEqual(prev: StationPinProps, next: StationPinProps) {
  if (prev.station === next.station) return true;

  return (
    prev.station.station_id === next.station.station_id &&
    prev.station.num_bikes_available === next.station.num_bikes_available &&
    prev.station.num_docks_available === next.station.num_docks_available &&
    prev.station.num_ebikes_available === next.station.num_ebikes_available &&
    prev.station.is_renting === next.station.is_renting &&
    prev.station.is_installed === next.station.is_installed
  );
}

export const StationPin = memo(function StationPin({
  station,
}: StationPinProps) {
  const isActive = isStationActive(station);
  const ratio = getAvailabilityRatio(station);
  const colors = getStatusColors(ratio, isActive);

  const glowFilter = useMemo(
    () => buildGlowFilter(colors.glowInner, colors.glowOuter),
    [colors.glowInner, colors.glowOuter],
  );

  return (
    <MapPin
      aria-hidden="true"
      className={cn(
        "pointer-events-none block size-6",
        isActive ? "opacity-90" : "opacity-20",
      )}
      style={{ filter: glowFilter }}
      color={colors.accent}
      weight="fill"
    />
  );
}, areStationPinPropsEqual);
