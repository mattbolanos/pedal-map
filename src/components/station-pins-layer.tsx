import { IconLayer } from "@deck.gl/layers";
import {
  availabilityColor,
  bucketRatio,
  getPinIconUrl,
  ICON_RES,
  pinSize,
} from "#/components/station-pin";
import type { CitiBikeStation } from "#/lib/citibike";

// ── Helpers ────────────────────────────────────────────────────

function hasValidCoordinates(s: CitiBikeStation) {
  return (
    Number.isFinite(s.lat) &&
    Number.isFinite(s.lon) &&
    s.lat >= -90 &&
    s.lat <= 90 &&
    s.lon >= -180 &&
    s.lon <= 180
  );
}

function availabilityRatio(s: CitiBikeStation): number {
  const bikes = s.num_bikes_available ?? 0;
  const docks = s.num_docks_available ?? 0;
  const total = bikes + docks;
  return total === 0 ? 0 : bikes / total;
}

function isActive(s: CitiBikeStation): boolean {
  return s.is_renting === 1 && s.is_installed === 1;
}

// ── Easing ─────────────────────────────────────────────────────
// Quadratic ease-out: fast initial response, gentle settle.
// Matches the "ease-out" principle — the user sees movement immediately.

const easeOut = (t: number) => t * (2 - t);

// ── Layer factory ──────────────────────────────────────────────

export function createStationPinsLayer(stations: CitiBikeStation[]) {
  const valid = stations.filter(hasValidCoordinates);
  if (valid.length === 0) return null;

  return new IconLayer<CitiBikeStation>({
    id: "station-pins",
    data: valid,
    pickable: true,

    getPosition: (s) => [s.lon, s.lat],

    getIcon: (s) => {
      const bucket = isActive(s) ? bucketRatio(availabilityRatio(s)) : 0;
      return {
        url: getPinIconUrl(bucket),
        width: ICON_RES,
        height: ICON_RES,
        mask: true,
      };
    },

    // Tints the white SVG mask → becomes the availability color.
    // deck.gl interpolates RGBA channels during transitions,
    // so a station going from 60 % → 30 % will smoothly shift
    // from teal through amber — no hard color jumps.
    getColor: (s) => availabilityColor(availabilityRatio(s), isActive(s)),

    // Area ∝ capacity (sqrt-scaled in pinSize).
    getSize: (s) => pinSize(s.capacity ?? 0),

    sizeUnits: "pixels",
    sizeMinPixels: 16,
    sizeMaxPixels: 30,

    // ── Transitions ────────────────────────────────────────
    // Smooth 800 ms color fade + 600 ms size morph on data refresh.
    // The easing mirrors Emil's "ease-out" principle: the visual
    // response starts immediately, then gently settles — so the
    // map never feels laggy even on 15-second polling intervals.
    transitions: {
      getColor: { duration: 800, easing: easeOut },
      getSize: { duration: 600, easing: easeOut },
    },

    updateTriggers: {
      getIcon: stations,
      getColor: stations,
      getSize: stations,
    },
  });
}
