import { bayRidgeRegion } from "./bay-ridge";
import { crownHeightsRegion } from "./crown-heights";
import { ditmasParkRegion } from "./ditmas-park";
import { eastFlatbushRegion } from "./east-flatbush";
import { flatbushRegion } from "./flatbush";
import { greenwoodHeightsRegion } from "./greenwood-heights";
import { kensingtonRegion } from "./kensington";
import { parkSlopeRegion } from "./park-slope";
import { prospectLeffertGardensRegion } from "./prospect-leffert-gardens";
import { prospectParkSouthRegion } from "./prospect-park-south";
import { southSlopeRegion } from "./south-slope";
import { sunsetParkRegion } from "./sunset-park";
import type {
	Coordinate,
	NeighborhoodRegionDefinition,
	RgbaColor,
} from "./types";
import { windsorTerraceRegion } from "./windsor-terrace";

type NeighborhoodRegion = (typeof neighborhoodRegions)[number];
type NeighborhoodRegionBucket = (typeof neighborhoodRegions)[number]["bucket"];

const neighborhoodRegions = [
	bayRidgeRegion,
	crownHeightsRegion,
	ditmasParkRegion,
	eastFlatbushRegion,
	greenwoodHeightsRegion,
	flatbushRegion,
	kensingtonRegion,
	parkSlopeRegion,
	prospectLeffertGardensRegion,
	prospectParkSouthRegion,
	southSlopeRegion,
	sunsetParkRegion,
	windsorTerraceRegion,
] as const satisfies readonly NeighborhoodRegionDefinition[];

export {
	neighborhoodRegions,
	type Coordinate,
	type NeighborhoodRegionDefinition,
	type RgbaColor,
	type NeighborhoodRegion,
	type NeighborhoodRegionBucket,
};
