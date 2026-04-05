import { describe, expect, it } from "vitest";
import { assignNeighborhoodBucket, getNeighborhoodBucketMeta } from "./bucket";
import { type Coordinate, neighborhoodRegions } from "./regions";

function smoothPolygonWithChaikin(points: readonly Coordinate[]): Coordinate[] {
	if (points.length < 3) {
		return [...points];
	}

	const smoothed: Coordinate[] = [];

	for (let index = 0; index < points.length; index += 1) {
		const [startLon, startLat] = points[index];
		const [endLon, endLat] = points[(index + 1) % points.length];

		smoothed.push([
			startLon * 0.75 + endLon * 0.25,
			startLat * 0.75 + endLat * 0.25,
		]);
		smoothed.push([
			startLon * 0.25 + endLon * 0.75,
			startLat * 0.25 + endLat * 0.75,
		]);
	}

	return smoothed;
}

function normalizePolygonCoordinates(
	points: readonly Coordinate[],
): Coordinate[] {
	if (points.length < 2) {
		return [...points];
	}

	const firstPoint = points[0];
	const lastPoint = points[points.length - 1];

	if (firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1]) {
		return points.slice(0, -1);
	}

	return [...points];
}

function getOrientation(a: Coordinate, b: Coordinate, c: Coordinate): number {
	return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function isPointOnSegment(
	start: Coordinate,
	end: Coordinate,
	point: Coordinate,
): boolean {
	const epsilon = 1e-12;

	return (
		point[0] >= Math.min(start[0], end[0]) - epsilon &&
		point[0] <= Math.max(start[0], end[0]) + epsilon &&
		point[1] >= Math.min(start[1], end[1]) - epsilon &&
		point[1] <= Math.max(start[1], end[1]) + epsilon
	);
}

function segmentsIntersect(
	startA: Coordinate,
	endA: Coordinate,
	startB: Coordinate,
	endB: Coordinate,
): boolean {
	const epsilon = 1e-12;
	const orientationA = getOrientation(startA, endA, startB);
	const orientationB = getOrientation(startA, endA, endB);
	const orientationC = getOrientation(startB, endB, startA);
	const orientationD = getOrientation(startB, endB, endA);

	if (
		((orientationA > epsilon && orientationB < -epsilon) ||
			(orientationA < -epsilon && orientationB > epsilon)) &&
		((orientationC > epsilon && orientationD < -epsilon) ||
			(orientationC < -epsilon && orientationD > epsilon))
	) {
		return true;
	}

	if (Math.abs(orientationA) <= epsilon) {
		return isPointOnSegment(startA, endA, startB);
	}

	if (Math.abs(orientationB) <= epsilon) {
		return isPointOnSegment(startA, endA, endB);
	}

	if (Math.abs(orientationC) <= epsilon) {
		return isPointOnSegment(startB, endB, startA);
	}

	if (Math.abs(orientationD) <= epsilon) {
		return isPointOnSegment(startB, endB, endA);
	}

	return false;
}

function hasSelfIntersection(points: readonly Coordinate[]): boolean {
	for (let index = 0; index < points.length; index += 1) {
		const startA = points[index];
		const endA = points[(index + 1) % points.length];

		for (
			let comparisonIndex = index + 1;
			comparisonIndex < points.length;
			comparisonIndex += 1
		) {
			if (
				comparisonIndex === index ||
				comparisonIndex === (index + 1) % points.length ||
				(comparisonIndex + 1) % points.length === index
			) {
				continue;
			}

			if (index === 0 && comparisonIndex === points.length - 1) {
				continue;
			}

			const startB = points[comparisonIndex];
			const endB = points[(comparisonIndex + 1) % points.length];

			if (segmentsIntersect(startA, endA, startB, endB)) {
				return true;
			}
		}
	}

	return false;
}

describe("assignNeighborhoodBucket", () => {
	it("returns Bay Ridge for points inside the new polygon", () => {
		expect(assignNeighborhoodBucket(40.6248, -74.0288)).toBe("bayRidge");
		expect(assignNeighborhoodBucket(40.6332, -74.0204)).toBe("bayRidge");
	});

	it("returns Sunset Park for points inside the new polygon", () => {
		expect(assignNeighborhoodBucket(40.645835, -74.010417)).toBe("sunsetPark");
		expect(assignNeighborhoodBucket(40.6518, -74.0108)).toBe("sunsetPark");
	});

	it("returns Kensington for points inside the new polygon", () => {
		expect(assignNeighborhoodBucket(40.646, -73.9756)).toBe("kensington");
		expect(assignNeighborhoodBucket(40.6475, -73.9735)).toBe("kensington");
	});

	it("returns Ditmas Park for points inside the new polygon", () => {
		expect(assignNeighborhoodBucket(40.639445, -73.963738)).toBe("ditmasPark");
		expect(assignNeighborhoodBucket(40.6455, -73.9655)).toBe("ditmasPark");
	});

	it("returns Greenwood Heights for points inside the new polygon", () => {
		expect(assignNeighborhoodBucket(40.658873, -74.001615)).toBe(
			"greenwoodHeights",
		);
		expect(assignNeighborhoodBucket(40.6603, -74.0008)).toBe(
			"greenwoodHeights",
		);
	});

	it("returns South Slope for points inside the new polygon", () => {
		expect(assignNeighborhoodBucket(40.661918, -73.989582)).toBe("southSlope");
		expect(assignNeighborhoodBucket(40.665324, -73.988779)).toBe("southSlope");
	});

	it("returns Park Slope for points inside the new polygon", () => {
		expect(assignNeighborhoodBucket(40.672131, -73.981251)).toBe("parkSlope");
		expect(assignNeighborhoodBucket(40.6778, -73.9798)).toBe("parkSlope");
	});

	it("assigns updated neighborhood coverage to the closest matching bucket", () => {
		expect(assignNeighborhoodBucket(40.655716, -74.006664)).toBe(
			"greenwoodHeights",
		);
		expect(assignNeighborhoodBucket(40.651654, -73.981231)).toBe(
			"windsorTerrace",
		);
	});

	it("keeps ambiguous or distant near misses in the broad fallback bucket", () => {
		expect(assignNeighborhoodBucket(40.65007, -73.96001)).toBe("nyc");
		expect(assignNeighborhoodBucket(40.654, -73.998)).toBe("nyc");
	});

	it("keeps the broad region labels as fallback buckets", () => {
		expect(assignNeighborhoodBucket(40.719, -74.043)).toBe("jerseyCity");
		expect(assignNeighborhoodBucket(40.7433, -74.0324)).toBe("hoboken");
		expect(assignNeighborhoodBucket(40.759, -73.8303)).toBe("nyc");
		expect(assignNeighborhoodBucket(40.9312, -73.8988)).toBe("nyc");
		expect(assignNeighborhoodBucket(40.6778, -73.9682)).toBe("nyc");
	});

	it("derives neighborhood labels from the region registry", () => {
		expect(getNeighborhoodBucketMeta("bayRidge")).toEqual({
			label: "Bay Ridge",
		});
		expect(getNeighborhoodBucketMeta("sunsetPark")).toEqual({
			label: "Sunset Park",
		});
		expect(getNeighborhoodBucketMeta("kensington")).toEqual({
			label: "Kensington",
		});
		expect(getNeighborhoodBucketMeta("ditmasPark")).toEqual({
			label: "Ditmas Park",
		});
		expect(getNeighborhoodBucketMeta("greenwoodHeights")).toEqual({
			label: "Greenwood Heights",
		});
		expect(getNeighborhoodBucketMeta("parkSlope")).toEqual({
			label: "Park Slope",
		});
		expect(getNeighborhoodBucketMeta("southSlope")).toEqual({
			label: "South Slope",
		});
	});

	it("keeps smoothed neighborhood polygons free of self intersections", () => {
		for (const region of neighborhoodRegions) {
			const normalizedCoordinates = normalizePolygonCoordinates(
				region.coordinates,
			);

			expect(hasSelfIntersection(normalizedCoordinates)).toBe(false);
			expect(
				hasSelfIntersection(smoothPolygonWithChaikin(normalizedCoordinates)),
			).toBe(false);
		}
	});
});
