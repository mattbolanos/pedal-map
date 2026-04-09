import type { NeighborhoodRegionDefinition } from "./types";

const coordinates = [
	[-73.9891754, 40.6886193],
	[-73.9784105, 40.6844336],
	[-73.9813831, 40.6799817],
	[-73.9878574, 40.6824935],
	[-73.9887007, 40.6812163],
	[-73.988914, 40.6812997],
	[-73.993053, 40.682909],
	[-73.9891754, 40.6886193],
] as const;

export const boerumHillRegion: NeighborhoodRegionDefinition = {
	bucket: "boerumHill",
	label: "Boerum Hill",
	coordinates,
	labelCoordinate: [-73.98535511183933, 40.68419722988949],
	fillColor: [107, 114, 128, 35] as const,
	lineColor: [107, 114, 128, 235] as const,
};
