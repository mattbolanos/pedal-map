import { bayRidgeRegion } from "./bay-ridge";
import { ditmasParkRegion } from "./ditmas-park";
import { kensingtonRegion } from "./kensington";
import { prospectParkSouthRegion } from "./prospect-park-south";
import { sunsetParkRegion } from "./sunset-park";
import type { NeighborhoodRegionDefinition } from "./types";

export type {
	Coordinate,
	NeighborhoodRegionDefinition,
	RgbaColor,
} from "./types";

export const neighborhoodRegions = [
	bayRidgeRegion,
	ditmasParkRegion,
	kensingtonRegion,
	prospectParkSouthRegion,
	sunsetParkRegion,
] as const satisfies readonly NeighborhoodRegionDefinition[];

export type NeighborhoodRegion = (typeof neighborhoodRegions)[number];
export type NeighborhoodRegionBucket =
	(typeof neighborhoodRegions)[number]["bucket"];
