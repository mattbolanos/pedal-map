export type StationRegionBadgeVariant = "jerseyCity" | "nyc" | "hoboken";

interface StationRegion {
	label: string;
	badgeVariant: StationRegionBadgeVariant;
	pinClassName: string;
}

const STATION_REGIONS: Record<string, StationRegion> = {
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
};

export function getStationRegion(regionId: string | undefined) {
	if (!regionId) {
		return null;
	}

	return STATION_REGIONS[regionId] ?? null;
}
