import type { LngLatBoundsLike } from "mapbox-gl";

export interface GeoCoordinates {
	lat: number;
	lon: number;
	accuracy?: number;
}

export const NYC_METRO_BOUNDS: LngLatBoundsLike = [
	[-74.3, 40.5],
	[-73.7, 40.95],
];

const EARTH_RADIUS_METERS = 6_371_000;
const METERS_PER_FOOT = 0.3048;
const METERS_PER_MILE = 1609.344;

function toRadians(value: number) {
	return (value * Math.PI) / 180;
}

export function isWithinBounds(
	coordinates: GeoCoordinates,
	bounds: LngLatBoundsLike = NYC_METRO_BOUNDS,
) {
	const [[minLon, minLat], [maxLon, maxLat]] = bounds as [
		[number, number],
		[number, number],
	];

	return (
		coordinates.lon >= minLon &&
		coordinates.lon <= maxLon &&
		coordinates.lat >= minLat &&
		coordinates.lat <= maxLat
	);
}

export function getDistanceBetweenCoordinates(
	origin: GeoCoordinates,
	destination: GeoCoordinates,
) {
	const latDelta = toRadians(destination.lat - origin.lat);
	const lonDelta = toRadians(destination.lon - origin.lon);
	const originLat = toRadians(origin.lat);
	const destinationLat = toRadians(destination.lat);

	const a =
		Math.sin(latDelta / 2) ** 2 +
		Math.cos(originLat) *
			Math.cos(destinationLat) *
			Math.sin(lonDelta / 2) ** 2;

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return EARTH_RADIUS_METERS * c;
}

export function formatDistance(distanceMeters: number) {
	if (!Number.isFinite(distanceMeters) || distanceMeters < 0) {
		return null;
	}

	if (distanceMeters < 0.18 * METERS_PER_MILE) {
		const feet = distanceMeters / METERS_PER_FOOT;
		return `${Math.max(50, Math.round(feet / 50) * 50)} ft`;
	}

	const miles = distanceMeters / METERS_PER_MILE;

	if (miles < 10) {
		return `${miles.toFixed(1)} mi`;
	}

	return `${Math.round(miles)} mi`;
}
