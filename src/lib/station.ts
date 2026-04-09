import type { CitiBikeStation } from "./citibike";

export function isStationActive(station: CitiBikeStation): boolean {
	return station.is_renting === 1 && station.is_installed === 1;
}
