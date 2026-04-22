const ICON_VISUAL_RES = 64;
const RES = 80;
const CX = RES / 2;
const CY = RES / 2;
const RING_R = 22;
const RING_W = 4;
const DOT_R = 11;
const SELECTED_GLOW_R = 31;
const SELECTED_RING_R = 28.5;
const SELECTED_INNER_RING_R = 26.75;
const BUCKET_STEP = 0.05;

export const ICON_RES = RES;
export const ICON_SIZE_SCALE = RES / ICON_VISUAL_RES;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcD(ratio: number): string {
  if (ratio <= 0) return "";
  if (ratio >= 1) {
    const a = polar(CX, CY, RING_R, 0);
    const b = polar(CX, CY, RING_R, 180);
    return [
      `M${a.x},${a.y}`,
      `A${RING_R},${RING_R} 0 1 1 ${b.x},${b.y}`,
      `A${RING_R},${RING_R} 0 1 1 ${a.x},${a.y}`,
    ].join(" ");
  }
  const endDeg = ratio * 360;
  const s = polar(CX, CY, RING_R, 0);
  const e = polar(CX, CY, RING_R, endDeg);
  const large = endDeg > 180 ? 1 : 0;
  return `M${s.x},${s.y} A${RING_R},${RING_R} 0 ${large} 1 ${e.x},${e.y}`;
}

const urlCache = new Map<string, string>();

export function getPinIconUrl(bucket: number, selected = false): string {
  const cacheKey = `${bucket}:${selected ? 1 : 0}`;
  const cached = urlCache.get(cacheKey);
  if (cached) return cached;

  const progress =
    bucket > 0
      ? `<path d="${arcD(bucket)}" fill="none" stroke="white" stroke-width="${RING_W}" stroke-linecap="round"/>`
      : "";
  const selectedAccent = selected
    ? [
        `<circle cx="${CX}" cy="${CY}" r="${SELECTED_GLOW_R}" fill="white" opacity="0.1"/>`,
        `<circle cx="${CX}" cy="${CY}" r="${SELECTED_RING_R}" fill="none" stroke="white" stroke-width="2.25" opacity="0.5"/>`,
        `<circle cx="${CX}" cy="${CY}" r="${SELECTED_INNER_RING_R}" fill="none" stroke="white" stroke-width="1.2" opacity="0.28"/>`,
      ].join("")
    : "";

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${RES}" height="${RES}">`,
    selectedAccent,
    `<circle cx="${CX}" cy="${CY}" r="${RING_R}" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="${RING_W}"/>`,
    progress,
    `<circle cx="${CX}" cy="${CY}" r="${DOT_R}" fill="white" opacity="0.92"/>`,
    `</svg>`,
  ].join("");

  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  urlCache.set(cacheKey, url);
  return url;
}

export function bucketRatio(ratio: number): number {
  return (
    Math.round(Math.max(0, Math.min(1, ratio)) / BUCKET_STEP) * BUCKET_STEP
  );
}

type RGBA = [number, number, number, number];
type StationAvailabilityTone = {
  color: RGBA;
  css: string;
};

const COLOR_STOPS: { t: number; c: RGBA }[] = [
  { t: 0, c: [239, 68, 68, 225] },
  { t: 0.32, c: [242, 178, 68, 225] },
  { t: 0.68, c: [52, 172, 120, 225] },
  { t: 1, c: [38, 158, 108, 225] },
];

const INACTIVE_COLOR: RGBA = [163, 172, 178, 160]; // muted-foreground neutral: [R, G, B, A]

function mix(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function rgbaToCss([r, g, b, a]: RGBA): string {
  return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
}

export function availabilityColor(ratio: number, active: boolean): RGBA {
  if (!active) return INACTIVE_COLOR;

  const r = Math.max(0, Math.min(1, ratio));

  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    if (r <= COLOR_STOPS[i + 1].t) {
      const localT =
        (r - COLOR_STOPS[i].t) / (COLOR_STOPS[i + 1].t - COLOR_STOPS[i].t);
      const a = COLOR_STOPS[i].c;
      const b = COLOR_STOPS[i + 1].c;
      return [
        mix(a[0], b[0], localT),
        mix(a[1], b[1], localT),
        mix(a[2], b[2], localT),
        mix(a[3], b[3], localT),
      ];
    }
  }

  return COLOR_STOPS[COLOR_STOPS.length - 1].c;
}

export function availabilityColorCss(ratio: number, active: boolean): string {
  return rgbaToCss(availabilityColor(ratio, active));
}

export function stationAvailabilityTone(
  ratio: number,
  active: boolean,
): StationAvailabilityTone {
  const color = availabilityColor(ratio, active);
  return {
    color,
    css: rgbaToCss(color),
  };
}

export function pinSize(capacity: number): number {
  const clamped = Math.max(10, Math.min(80, capacity));
  return 14 + Math.sqrt(clamped) * 3;
}
