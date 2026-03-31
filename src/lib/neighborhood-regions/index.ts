import { bayRidgeRegion } from "./bay-ridge";
import { sunsetParkRegion } from "./sunset-park";
import type { NeighborhoodRegionDefinition } from "./types";

export type {
	Coordinate,
	NeighborhoodRegionDefinition,
	RgbaColor,
} from "./types";

export const neighborhoodRegions = [
	bayRidgeRegion,
	sunsetParkRegion,
] as const satisfies readonly NeighborhoodRegionDefinition[];

export type NeighborhoodRegion = (typeof neighborhoodRegions)[number];
export type NeighborhoodRegionBucket =
	(typeof neighborhoodRegions)[number]["bucket"];
