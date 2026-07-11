import type { CitiBikeStation } from "#/lib/citibike";

export interface StationRankPair {
  bikesAvailable: number | null;
  ebikesAvailable: number | null;
}

function buildRankMap(
  stations: CitiBikeStation[],
  getValue: (station: CitiBikeStation) => number | undefined,
) {
  const ranked = stations
    .map((station) => ({ station, value: getValue(station) }))
    .filter(
      (entry): entry is { station: CitiBikeStation; value: number } =>
        entry.value !== undefined,
    )
    .sort(
      (left, right) =>
        right.value - left.value ||
        left.station.name.localeCompare(right.station.name),
    );
  const ranks = new Map<string, number>();
  let previousValue: number | null = null;
  let previousRank = 0;

  for (const [index, entry] of ranked.entries()) {
    const rank =
      previousValue !== null && entry.value === previousValue
        ? previousRank
        : index + 1;
    ranks.set(entry.station.station_id, rank);
    previousValue = entry.value;
    previousRank = rank;
  }

  return ranks;
}

export function buildCurrentStationRanks(stations: CitiBikeStation[]) {
  const bikesRanks = buildRankMap(
    stations,
    (station) => station.num_bikes_available,
  );
  const ebikesRanks = buildRankMap(
    stations,
    (station) => station.num_ebikes_available,
  );

  return new Map<string, StationRankPair>(
    stations.map((station) => [
      station.station_id,
      {
        bikesAvailable: bikesRanks.get(station.station_id) ?? null,
        ebikesAvailable: ebikesRanks.get(station.station_id) ?? null,
      },
    ]),
  );
}
