import { describe, expect, it } from "vitest";
import type { CitiBikeStation } from "./citibike";
import { buildCurrentStationRanks } from "./station-ranks";

function station(
  stationId: string,
  bikes: number,
  ebikes: number,
): CitiBikeStation {
  return {
    station_id: stationId,
    name: stationId,
    lat: 0,
    lon: 0,
    num_bikes_available: bikes,
    num_ebikes_available: ebikes,
  };
}

describe("buildCurrentStationRanks", () => {
  it("uses competition ranks and preserves ties", () => {
    const ranks = buildCurrentStationRanks([
      station("a", 10, 2),
      station("b", 10, 5),
      station("c", 4, 2),
    ]);

    expect(ranks.get("a")).toEqual({
      bikesAvailable: 1,
      ebikesAvailable: 2,
    });
    expect(ranks.get("b")).toEqual({
      bikesAvailable: 1,
      ebikesAvailable: 1,
    });
    expect(ranks.get("c")).toEqual({
      bikesAvailable: 3,
      ebikesAvailable: 2,
    });
  });
});
