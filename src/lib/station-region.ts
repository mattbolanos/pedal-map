export type StationRegionBadgeVariant = "jerseyCity" | "nyc" | "hoboken";

const STATION_REGIONS = {
	"70": {
		label: "Jersey City",
		badgeVariant: "jerseyCity",
		pinClassName: "text-violet-300",
	},
	"71": {
		label: "NYC",
		badgeVariant: "nyc",
		pinClassName: "text-sky-300",
	},
	"311": {
		label: "Hoboken",
		badgeVariant: "hoboken",
		pinClassName: "text-pink-300",
	},
} as const satisfies Record<
	string,
	{
		label: string;
		badgeVariant: StationRegionBadgeVariant;
		pinClassName: string;
	}
>;

const STATION_REGION_OVERRIDES: Partial<Record<string, StationRegionId>> = {
	"66dbc860-0aca-11e7-82f6-3863bb44ef7c": "71",
};

export type StationRegionId = keyof typeof STATION_REGIONS;
export type StationRegion = (typeof STATION_REGIONS)[StationRegionId];
export type StationRegionLabel = StationRegion["label"];

export function isStationRegionId(value: string): value is StationRegionId {
	return Object.hasOwn(STATION_REGIONS, value);
}

export function normalizeStationRegionId(
	regionId: string | undefined,
): StationRegionId | undefined {
	if (!regionId || !isStationRegionId(regionId)) {
		return undefined;
	}

	return regionId;
}

export function getStationRegion(
	regionId: StationRegionId | undefined,
	stationId: string,
) {
	if (!regionId) {
		const overriddenRegionId = STATION_REGION_OVERRIDES[stationId];
		if (overriddenRegionId) {
			return STATION_REGIONS[overriddenRegionId];
		}
		return null;
	}

	return STATION_REGIONS[regionId];
}
