export type Coordinate = readonly [lon: number, lat: number];

export type RgbaColor = readonly [
	red: number,
	green: number,
	blue: number,
	alpha: number,
];

export interface NeighborhoodRegionDefinition {
	bucket: string;
	label: string;
	coordinates: readonly Coordinate[];
	labelCoordinate: Coordinate;
	fillColor: RgbaColor;
	lineColor: RgbaColor;
}
