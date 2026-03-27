import { ScatterplotLayer } from "@deck.gl/layers";
import type { CitiBikeStation } from "#/lib/citibike";

function hasValidCoordinates(station: CitiBikeStation) {
	return (
		Number.isFinite(station.lat) &&
		Number.isFinite(station.lon) &&
		station.lat >= -90 &&
		station.lat <= 90 &&
		station.lon >= -180 &&
		station.lon <= 180
	);
}

function getAvailabilityRatio(station: CitiBikeStation): number {
	const bikes = station.num_bikes_available ?? 0;
	const docks = station.num_docks_available ?? 0;
	const total = bikes + docks;

	if (total === 0) {
		return 0;
	}

	return bikes / total;
}

function isStationActive(station: CitiBikeStation): boolean {
	return station.is_renting === 1 && station.is_installed === 1;
}

function getStationFillColor(
	station: CitiBikeStation,
): [number, number, number, number] {
	if (!isStationActive(station)) {
		return [89, 96, 115, 70];
	}

	const ratio = getAvailabilityRatio(station);

	if (ratio < 0.25) {
		return [240, 113, 86, 220];
	}

	if (ratio < 0.5) {
		return [248, 192, 82, 220];
	}

	return [67, 205, 170, 220];
}

function getStationLineColor(
	station: CitiBikeStation,
): [number, number, number, number] {
	if (!isStationActive(station)) {
		return [51, 65, 85, 120];
	}

	const ratio = getAvailabilityRatio(station);

	if (ratio < 0.25) {
		return [166, 56, 33, 255];
	}

	if (ratio < 0.5) {
		return [168, 118, 33, 255];
	}

	return [20, 120, 108, 255];
}

function getStationRadius(station: CitiBikeStation): number {
	const capacity = station.capacity ?? 0;

	if (capacity >= 60) {
		return 10;
	}

	if (capacity >= 30) {
		return 8;
	}

	return 6;
}

export function createStationPinsLayer(stations: CitiBikeStation[]) {
	const validStations = stations.filter(hasValidCoordinates);

	if (validStations.length === 0) {
		return null;
	}

	return new ScatterplotLayer<CitiBikeStation>({
		id: "station-pins",
		data: validStations,
		pickable: true,
		stroked: true,
		filled: true,
		radiusUnits: "pixels",
		lineWidthUnits: "pixels",
		getPosition: (station) => [station.lon, station.lat],
		getRadius: getStationRadius,
		getFillColor: getStationFillColor,
		getLineColor: getStationLineColor,
		getLineWidth: 1.5,
		radiusMinPixels: 4,
		radiusMaxPixels: 14,
		updateTriggers: {
			getFillColor: stations,
			getLineColor: stations,
			getRadius: stations,
		},
	});
}
