import type { NeighborhoodRegionDefinition } from "./types";

const coordinates = [
	[-73.9977951, 40.6912019],
	[-74.0006494, 40.6852489],
	[-73.995241, 40.6837441],
	[-73.9930533, 40.6829041],
	[-73.9892546, 40.6885361],
	[-73.9891677, 40.6886173],
	[-73.9904729, 40.6890775],
	[-73.9906776, 40.6891469],
	[-73.9913691, 40.6893712],
	[-73.992364, 40.6896865],
	[-73.994357, 40.6902416],
	[-73.9953104, 40.6905043],
	[-73.9962288, 40.6907573],
	[-73.9975175, 40.6911244],
	[-73.9977951, 40.6912019],
] as const;

export const cobbleHillRegion: NeighborhoodRegionDefinition = {
	bucket: "cobbleHill",
	label: "Cobble Hill",
	coordinates,
	labelCoordinate: [-73.99520313756074, 40.687098864503376],
	fillColor: [210, 170, 100, 25] as const,
	lineColor: [230, 190, 120, 120] as const,
};
