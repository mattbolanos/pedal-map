export type NeighborhoodBucket =
	| "nyc"
	| "jerseyCity"
	| "hoboken"
	| "chelsea"
	| "westVillage"
	| "eastVillage"
	| "lowerManhattan"
	| "harlem"
	| "upperWestSide"
	| "upperEastSide"
	| "midtownEast"
	| "dumbo"
	| "downtownBrooklyn"
	| "parkSlope"
	| "prospectHeights"
	| "crownHeights"
	| "bedStuyBushwick"
	| "williamsburg"
	| "greenpoint"
	| "longIslandCity"
	| "astoria";

interface Bounds {
	minLat: number;
	maxLat: number;
	minLon: number;
	maxLon: number;
}

interface NeighborhoodZone {
	bucket: Exclude<NeighborhoodBucket, "nyc" | "jerseyCity" | "hoboken">;
	label: string;
	bounds: Bounds;
}

interface NeighborhoodBucketMeta {
	label: string;
}

const NEIGHBORHOOD_ZONES: NeighborhoodZone[] = [
	{
		bucket: "chelsea",
		label: "Chelsea",
		bounds: {
			minLat: 40.738,
			maxLat: 40.756,
			minLon: -74.012,
			maxLon: -73.991,
		},
	},
	{
		bucket: "westVillage",
		label: "West Village",
		bounds: {
			minLat: 40.721,
			maxLat: 40.738,
			minLon: -74.012,
			maxLon: -73.991,
		},
	},
	{
		bucket: "eastVillage",
		label: "East Village",
		bounds: {
			minLat: 40.721,
			maxLat: 40.739,
			minLon: -73.991,
			maxLon: -73.971,
		},
	},
	{
		bucket: "dumbo",
		label: "Dumbo",
		bounds: {
			minLat: 40.698,
			maxLat: 40.706,
			minLon: -74.008,
			maxLon: -73.987,
		},
	},
	{
		bucket: "lowerManhattan",
		label: "Lower Manhattan",
		bounds: { minLat: 40.699, maxLat: 40.721, minLon: -74.02, maxLon: -73.97 },
	},
	{
		bucket: "harlem",
		label: "Harlem",
		bounds: {
			minLat: 40.798,
			maxLat: 40.828,
			minLon: -73.963,
			maxLon: -73.924,
		},
	},
	{
		bucket: "upperWestSide",
		label: "Upper West Side",
		bounds: {
			minLat: 40.764,
			maxLat: 40.798,
			minLon: -73.988,
			maxLon: -73.963,
		},
	},
	{
		bucket: "upperEastSide",
		label: "Upper East Side",
		bounds: {
			minLat: 40.764,
			maxLat: 40.798,
			minLon: -73.963,
			maxLon: -73.939,
		},
	},
	{
		bucket: "midtownEast",
		label: "Midtown East",
		bounds: {
			minLat: 40.739,
			maxLat: 40.764,
			minLon: -73.991,
			maxLon: -73.964,
		},
	},
	{
		bucket: "downtownBrooklyn",
		label: "Downtown Brooklyn",
		bounds: { minLat: 40.684, maxLat: 40.705, minLon: -74.006, maxLon: -73.98 },
	},
	{
		bucket: "parkSlope",
		label: "Park Slope",
		bounds: { minLat: 40.66, maxLat: 40.684, minLon: -74.01, maxLon: -73.97 },
	},
	{
		bucket: "prospectHeights",
		label: "Prospect Heights",
		bounds: {
			minLat: 40.671,
			maxLat: 40.684,
			minLon: -73.981,
			maxLon: -73.957,
		},
	},
	{
		bucket: "crownHeights",
		label: "Crown Heights",
		bounds: { minLat: 40.66, maxLat: 40.69, minLon: -73.97, maxLon: -73.93 },
	},
	{
		bucket: "greenpoint",
		label: "Greenpoint",
		bounds: {
			minLat: 40.721,
			maxLat: 40.739,
			minLon: -73.97,
			maxLon: -73.935,
		},
	},
	{
		bucket: "williamsburg",
		label: "Williamsburg",
		bounds: {
			minLat: 40.705,
			maxLat: 40.721,
			minLon: -73.97,
			maxLon: -73.95,
		},
	},
	{
		bucket: "bedStuyBushwick",
		label: "Bed-Stuy / Bushwick",
		bounds: { minLat: 40.68, maxLat: 40.715, minLon: -73.96, maxLon: -73.9 },
	},
	{
		bucket: "longIslandCity",
		label: "Long Island City",
		bounds: { minLat: 40.73, maxLat: 40.755, minLon: -73.965, maxLon: -73.92 },
	},
	{
		bucket: "astoria",
		label: "Astoria",
		bounds: { minLat: 40.755, maxLat: 40.785, minLon: -73.95, maxLon: -73.89 },
	},
];

const METRO_BUCKET_META: Record<
	Extract<NeighborhoodBucket, "nyc" | "jerseyCity" | "hoboken">,
	NeighborhoodBucketMeta
> = {
	nyc: { label: "NYC" },
	jerseyCity: { label: "Jersey City" },
	hoboken: { label: "Hoboken" },
};

const ZONE_BUCKET_META = Object.fromEntries(
	NEIGHBORHOOD_ZONES.map(({ bucket, label }) => [bucket, { label }]),
) as Record<NeighborhoodZone["bucket"], NeighborhoodBucketMeta>;

export const neighborhoodBucketMeta: Record<
	NeighborhoodBucket,
	NeighborhoodBucketMeta
> = {
	...METRO_BUCKET_META,
	...ZONE_BUCKET_META,
};

function isWithinBounds(lat: number, lon: number, bounds: Bounds): boolean {
	return (
		lat >= bounds.minLat &&
		lat <= bounds.maxLat &&
		lon >= bounds.minLon &&
		lon <= bounds.maxLon
	);
}

function getMetroBucket(lat: number, lon: number): NeighborhoodBucket {
	if (
		isWithinBounds(lat, lon, {
			minLat: 40.735,
			maxLat: 40.756,
			minLon: -74.045,
			maxLon: -74.022,
		})
	) {
		return "hoboken";
	}

	if (
		isWithinBounds(lat, lon, {
			minLat: 40.69,
			maxLat: 40.755,
			minLon: -74.1,
			maxLon: -74.032,
		})
	) {
		return "jerseyCity";
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

	for (const zone of NEIGHBORHOOD_ZONES) {
		if (isWithinBounds(lat, lon, zone.bounds)) {
			return zone.bucket;
		}
	}

	return metroBucket;
}

export function getNeighborhoodBucketMeta(
	bucket: NeighborhoodBucket,
): NeighborhoodBucketMeta {
	return neighborhoodBucketMeta[bucket];
}
