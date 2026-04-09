import { bayRidgeRegion } from "./bay-ridge";
import { boerumHillRegion } from "./boerum-hill";
import { carrollGardensRegion } from "./carroll-gardens";
import { cobbleHillRegion } from "./cobble-hill";
import { columbiaStWaterFrontRegion } from "./columbia-st-water-front";
import { crownHeightsRegion } from "./crown-heights";
import { ditmasParkRegion } from "./ditmas-park";
import { eastFlatbushRegion } from "./east-flatbush";
import { flatbushRegion } from "./flatbush";
import { governorsIslandRegion } from "./governors-island";
import { gowanusRegion } from "./gowanus";
import { greenwoodHeightsRegion } from "./greenwood-heights";
import { kensingtonRegion } from "./kensington";
import { oceanHillRegion } from "./ocean-hill";
import { parkSlopeRegion } from "./park-slope";
import { prospectHeightsRegion } from "./prospect-heights";
import { prospectLeffertGardensRegion } from "./prospect-leffert-gardens";
import { prospectParkSouthRegion } from "./prospect-park-south";
import { redHookRegion } from "./red-hook";
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
	boerumHillRegion,
	carrollGardensRegion,
	columbiaStWaterFrontRegion,
	crownHeightsRegion,
	cobbleHillRegion,
	ditmasParkRegion,
	eastFlatbushRegion,
	governorsIslandRegion,
	gowanusRegion,
	oceanHillRegion,
	prospectHeightsRegion,
	redHookRegion,
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
