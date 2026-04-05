import { bayRidgeRegion } from "./bay-ridge";
import { ditmasParkRegion } from "./ditmas-park";
import { greenwoodHeightsRegion } from "./greenwood-heights";
import { kensingtonRegion } from "./kensington";
import { prospectParkSouthRegion } from "./prospect-park-south";
import { southSlopeRegion } from "./south-slope";
import { sunsetParkRegion } from "./sunset-park";
import type { NeighborhoodRegionDefinition } from "./types";
import { windsorTerraceRegion } from "./windsor-terrace";

export type {
	Coordinate,
	NeighborhoodRegionDefinition,
	RgbaColor,
} from "./types";

export const neighborhoodRegions = [
	bayRidgeRegion,
	ditmasParkRegion,
	greenwoodHeightsRegion,
	kensingtonRegion,
	prospectParkSouthRegion,
	southSlopeRegion,
	sunsetParkRegion,
	windsorTerraceRegion,
] as const satisfies readonly NeighborhoodRegionDefinition[];

export type NeighborhoodRegion = (typeof neighborhoodRegions)[number];
export type NeighborhoodRegionBucket =
	(typeof neighborhoodRegions)[number]["bucket"];
