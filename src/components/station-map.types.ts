import type { CitiBikeStation } from "#/lib/citibike";

export interface HoveredStation {
	station: CitiBikeStation;
}

export interface TooltipPosition {
	left: number;
	top: number;
}
