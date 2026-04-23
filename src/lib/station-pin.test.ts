import { describe, expect, it } from "vitest";

import {
  bucketRatio,
  getPinIconUrl,
  stationAvailabilityRatio,
} from "./station-pin";

describe("stationAvailabilityRatio", () => {
  it("uses station capacity as the denominator", () => {
    expect(stationAvailabilityRatio(42, 46)).toBeCloseTo(0.913, 3);
  });

  it("clamps invalid or out-of-range values", () => {
    expect(stationAvailabilityRatio(1, 0)).toBe(0);
    expect(stationAvailabilityRatio(undefined, 10)).toBe(0);
    expect(stationAvailabilityRatio(12, 10)).toBe(1);
  });
});

describe("bucketRatio", () => {
  it("tracks the rounded display percent instead of coarse five-percent steps", () => {
    expect(bucketRatio(stationAvailabilityRatio(42, 46))).toBe(0.91);
  });
});

describe("getPinIconUrl", () => {
  it("draws progress with a non-rounded cap so partial rings stay visibly open", () => {
    const svgUrl = getPinIconUrl(0.91);
    const svg = decodeURIComponent(svgUrl.split(",", 2)[1] ?? "");

    expect(svg).toContain('stroke-linecap="butt"');
  });
});
