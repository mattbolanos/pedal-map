import { memo, useMemo } from "react";
import type { CitiBikeStation } from "#/lib/citibike";

/**
 * Four-state pin palette driven by oklch CSS custom properties.
 *
 * Tokens live in styles.css under `.dark`:
 *   --pin-high          teal-cyan     (≥ 50 % bikes)
 *   --pin-avg           amber-gold    (25–49 %)
 *   --pin-low           warm coral    (< 25 %)
 *   --pin-inactive      muted slate   (offline)
 */
type PinVariant = "high" | "avg" | "low" | "inactive";

const PIN_STYLES: Record<
  PinVariant,
  { fill: string; stroke: string; glow: string; glowOuter: string }
> = {
  high: {
    fill: "var(--pin-high)",
    stroke: "var(--pin-high-stroke)",
    glow: "oklch(0.82 0.155 170 / 0.45)",
    glowOuter: "oklch(0.82 0.155 170 / 0.12)",
  },
  avg: {
    fill: "var(--pin-avg)",
    stroke: "var(--pin-avg-stroke)",
    glow: "oklch(0.82 0.165 80 / 0.40)",
    glowOuter: "oklch(0.82 0.165 80 / 0.10)",
  },
  low: {
    fill: "var(--pin-low)",
    stroke: "var(--pin-low-stroke)",
    glow: "oklch(0.72 0.19 25 / 0.40)",
    glowOuter: "oklch(0.72 0.19 25 / 0.10)",
  },
  inactive: {
    fill: "var(--pin-inactive)",
    stroke: "var(--pin-inactive-stroke)",
    glow: "oklch(0.35 0.015 250 / 0.08)",
    glowOuter: "oklch(0.35 0.015 250 / 0.02)",
  },
};

function getAvailabilityRatio(station: CitiBikeStation): number {
  const bikes = station.num_bikes_available ?? 0;
  const docks = station.num_docks_available ?? 0;
  const total = bikes + docks;
  if (total === 0) return 0;
  return bikes / total;
}

function isStationActive(station: CitiBikeStation): boolean {
  return station.is_renting === 1 && station.is_installed === 1;
}

function getVariant(ratio: number, isActive: boolean): PinVariant {
  if (!isActive) return "inactive";
  if (ratio < 0.25) return "low";
  if (ratio < 0.5) return "avg";
  return "high";
}

function buildGlowFilter(glow: string, glowOuter: string): string {
  return `drop-shadow(0 0 1px ${glow}) drop-shadow(0 0 3px ${glowOuter})`;
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
  const variant = getVariant(ratio, isActive);
  const colors = PIN_STYLES[variant];

  const glowFilter = useMemo(
    () => buildGlowFilter(colors.glow, colors.glowOuter),
    [colors.glow, colors.glowOuter],
  );

  return (
    <svg
      aria-hidden="true"
      width="14"
      height="20"
      viewBox="0 0 14 20"
      fill="none"
      className="pointer-events-none block"
      style={{
        filter: glowFilter,
        opacity: isActive ? 0.88 : 0.15,
      }}
    >
      {/* Teardrop pin silhouette */}
      <path
        d="M7 0C3.13 0 0 3.13 0 7c0 4.88 6.35 11.8 6.62 12.1a.52.52 0 0 0 .76 0C7.65 18.8 14 11.88 14 7c0-3.87-3.13-7-7-7Z"
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth="0.6"
      />
      {/* Inner circle — dark center for depth */}
      <circle cx="7" cy="7" r="2.6" fill="oklch(0 0 0 / 0.2)" />
    </svg>
  );
}, areStationPinPropsEqual);
