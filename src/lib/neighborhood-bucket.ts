import type { Layer } from "@deck.gl/core";
import { PolygonLayer, TextLayer } from "@deck.gl/layers";
import {
	type Coordinate,
	type NeighborhoodRegion,
	type NeighborhoodRegionBucket,
	neighborhoodRegions,
} from "./neighborhood-regions";

type MetroBucket = "nyc" | "jerseyCity" | "hoboken";
export type NeighborhoodBucket = MetroBucket | NeighborhoodRegionBucket;

interface Bounds {
	minLat: number;
	maxLat: number;
	minLon: number;
	maxLon: number;
}

interface NeighborhoodBucketMeta {
	label: string;
}

type RenderableNeighborhoodRegion = NeighborhoodRegion & {
	renderCoordinates: readonly Coordinate[];
};

const metroBucketMeta = {
	nyc: { label: "NYC" },
	jerseyCity: { label: "Jersey City" },
	hoboken: { label: "Hoboken" },
} satisfies Record<MetroBucket, NeighborhoodBucketMeta>;

const metroBucketBounds = [
	{
		bucket: "hoboken",
		bounds: {
			minLat: 40.735,
			maxLat: 40.756,
			minLon: -74.045,
			maxLon: -74.022,
		},
	},
	{
		bucket: "jerseyCity",
		bounds: {
			minLat: 40.69,
			maxLat: 40.755,
			minLon: -74.1,
			maxLon: -74.032,
		},
	},
] as const satisfies readonly {
	bucket: Exclude<MetroBucket, "nyc">;
	bounds: Bounds;
}[];

function smoothPolygonWithChaikin(points: readonly Coordinate[]): Coordinate[] {
	if (points.length < 3) {
		return [...points];
	}

	let smoothed = [...points];

	for (let iteration = 0; iteration < 1; iteration += 1) {
		const next: Coordinate[] = [];

		for (let index = 0; index < smoothed.length; index += 1) {
			const [startLon, startLat] = smoothed[index];
			const [endLon, endLat] = smoothed[(index + 1) % smoothed.length];

			next.push([
				startLon * 0.75 + endLon * 0.25,
				startLat * 0.75 + endLat * 0.25,
			]);
			next.push([
				startLon * 0.25 + endLon * 0.75,
				startLat * 0.25 + endLat * 0.75,
			]);
		}

		smoothed = next;
	}

	return smoothed;
}

function prepareNeighborhoodRegion(
	region: NeighborhoodRegion,
): RenderableNeighborhoodRegion {
	return {
		...region,
		renderCoordinates: smoothPolygonWithChaikin(region.coordinates),
	};
}

const renderableNeighborhoodRegions = neighborhoodRegions.map(
	prepareNeighborhoodRegion,
);

const regionBucketMeta = Object.fromEntries(
	neighborhoodRegions.map((region) => [region.bucket, { label: region.label }]),
) as Record<NeighborhoodRegionBucket, NeighborhoodBucketMeta>;

export const neighborhoodBucketMeta: Record<
	NeighborhoodBucket,
	NeighborhoodBucketMeta
> = {
	...metroBucketMeta,
	...regionBucketMeta,
};

function isWithinBounds(lat: number, lon: number, bounds: Bounds): boolean {
	return (
		lat >= bounds.minLat &&
		lat <= bounds.maxLat &&
		lon >= bounds.minLon &&
		lon <= bounds.maxLon
	);
}

function isPointOnSegment(
	lat: number,
	lon: number,
	start: Coordinate,
	end: Coordinate,
): boolean {
	const [startLon, startLat] = start;
	const [endLon, endLat] = end;
	const cross =
		(lat - startLat) * (endLon - startLon) -
		(lon - startLon) * (endLat - startLat);

	if (Math.abs(cross) > 1e-10) {
		return false;
	}

	const minLon = Math.min(startLon, endLon) - 1e-10;
	const maxLon = Math.max(startLon, endLon) + 1e-10;
	const minLat = Math.min(startLat, endLat) - 1e-10;
	const maxLat = Math.max(startLat, endLat) + 1e-10;

	return lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat;
}

function isWithinPolygon(
	lat: number,
	lon: number,
	coordinates: readonly Coordinate[],
): boolean {
	let isInside = false;

	for (
		let pointIndex = 0, previousIndex = coordinates.length - 1;
		pointIndex < coordinates.length;
		previousIndex = pointIndex++
	) {
		const current = coordinates[pointIndex];
		const previous = coordinates[previousIndex];

		if (isPointOnSegment(lat, lon, previous, current)) {
			return true;
		}

		const [currentLon, currentLat] = current;
		const [previousLon, previousLat] = previous;
		const intersectsLatitude = currentLat > lat !== previousLat > lat;

		if (!intersectsLatitude) {
			continue;
		}

		const intersectLon =
			((previousLon - currentLon) * (lat - currentLat)) /
				(previousLat - currentLat) +
			currentLon;

		if (lon < intersectLon) {
			isInside = !isInside;
		}
	}

	return isInside;
}

function getMetroBucket(lat: number, lon: number): MetroBucket {
	for (const metroBucket of metroBucketBounds) {
		if (isWithinBounds(lat, lon, metroBucket.bounds)) {
			return metroBucket.bucket;
		}
	}

	return "nyc";
}

export function assignNeighborhoodBucket(
	lat: number,
	lon: number,
): NeighborhoodBucket {
	const metroBucket = getMetroBucket(lat, lon);

	if (metroBucket !== "nyc") {
		return metroBucket;
	}

	for (const region of renderableNeighborhoodRegions) {
		if (isWithinPolygon(lat, lon, region.coordinates)) {
			return region.bucket;
		}
	}

	return metroBucket;
}

export function getNeighborhoodBucketMeta(
	bucket: NeighborhoodBucket,
): NeighborhoodBucketMeta {
	return neighborhoodBucketMeta[bucket];
}

export function createNeighborhoodPolygonsLayer({
	showLabels = true,
}: {
	showLabels?: boolean;
} = {}) {
	const layers: Layer[] = [
		new PolygonLayer<RenderableNeighborhoodRegion>({
			id: "neighborhood-polygons",
			data: renderableNeighborhoodRegions,
			filled: true,
			stroked: true,
			pickable: false,
			wireframe: false,
			getPolygon: (region) => region.renderCoordinates,
			getFillColor: (region) => region.fillColor,
			getLineColor: (region) => region.lineColor,
			lineWidthMinPixels: 2,
		}),
	];

	if (showLabels) {
		layers.push(
			new TextLayer<RenderableNeighborhoodRegion>({
				id: "neighborhood-polygon-labels",
				data: renderableNeighborhoodRegions,
				pickable: false,
				billboard: true,
				background: true,
				getPosition: (region) => region.labelCoordinate,
				getText: (region) => region.label,
				getColor: () => [232, 248, 255, 255],
				getSize: () => 12,
				getTextAnchor: () => "middle",
				getAlignmentBaseline: () => "center",
				getBackgroundColor: () => [20, 20, 20, 255],
				fontFamily: "'Geist Mono', Menlo, Monaco, 'Courier New', monospace",
				fontWeight: 600,
				sizeMinPixels: 12,
				sizeMaxPixels: 18,
				backgroundPadding: [8, 5],
				backgroundBorderRadius: 24,
			}),
		);
	}

	return layers;
}
