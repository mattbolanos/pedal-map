import { bayRidgeRegion } from "./bay-ridge";
import type { NeighborhoodRegionDefinition } from "./types";

export type {
	Coordinate,
	NeighborhoodRegionDefinition,
	RgbaColor,
} from "./types";

export const neighborhoodRegions = [
	bayRidgeRegion,
] as const satisfies readonly NeighborhoodRegionDefinition[];

export type NeighborhoodRegion = (typeof neighborhoodRegions)[number];
export type NeighborhoodRegionBucket =
	(typeof neighborhoodRegions)[number]["bucket"];
