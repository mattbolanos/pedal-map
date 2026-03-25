import { useMemo } from "react";
import type { CitiBikeStation } from "#/lib/citibike";

const PIN_SIZE = 26;

/**
 * Pin geometry — teardrop shape with the data ring nestled inside the head.
 *
 * viewBox 0 0 24 28:
 *   Pin head center: (12, 10), head radius ~7
 *   Pin tip: (12, 26)
 *   Availability ring: center (12, 10), r = 4.2
 */
const VIEWBOX_W = 24;
const VIEWBOX_H = 28;
const HEAD_CX = 12;
const HEAD_CY = 10;
const RING_R = 4.2;
const RING_STROKE = 1.6;
const CIRCUMFERENCE = 2 * Math.PI * RING_R;

/** Teardrop path — rounded head tapering to a point */
const PIN_PATH =
	"M12 26C9.6 22.6 4 16.2 4 10a8 8 0 0 1 16 0c0 6.2-5.6 12.6-8 16Z";

/**
 * Color palette — blue-to-amber gradient that harmonises with the
 * deep-blue/purple design system and reads clearly on a dark basemap.
 *
 * Scale:  healthy (cool blue) → moderate (lavender) → low (warm amber) → empty (coral-orange)
 * Concept: cool = plentiful/calm, warm = urgent/scarce.
 */
const STATUS_COLORS = {
	healthy: { fill: "#60a5fa", glow: "rgba(96, 165, 250, 0.32)", dot: "#eff6ff" },
	moderate: { fill: "#a78bfa", glow: "rgba(167, 139, 250, 0.28)", dot: "#f5f3ff" },
	low: { fill: "#f59e0b", glow: "rgba(245, 158, 11, 0.28)", dot: "#fffbeb" },
	empty: { fill: "#f97316", glow: "rgba(249, 115, 22, 0.30)", dot: "#fff7ed" },
	offline: { fill: "#475569", glow: "rgba(71, 85, 105, 0.10)", dot: "#94a3b8" },
} as const;

function getAvailabilityRatio(station: CitiBikeStation): number {
	const bikes = station.num_bikes_available ?? 0;
	const docks = station.num_docks_available ?? 0;
	const total = bikes + docks;
	if (total === 0) return 0;
	return bikes / total;
}

function getStatusColors(ratio: number, isActive: boolean) {
	if (!isActive) return STATUS_COLORS.offline;
	if (ratio === 0) return STATUS_COLORS.empty;
	if (ratio < 0.25) return STATUS_COLORS.low;
	if (ratio < 0.5) return STATUS_COLORS.moderate;
	return STATUS_COLORS.healthy;
}

function isStationActive(station: CitiBikeStation): boolean {
	return station.is_renting === 1 && station.is_installed === 1;
}

interface StationPinProps {
	station: CitiBikeStation;
}

export function StationPin({ station }: StationPinProps) {
	const { ratio, colors, isActive, hasEbikes, dashArray } = useMemo(() => {
		const active = isStationActive(station);
		const r = getAvailabilityRatio(station);
		const c = getStatusColors(r, active);
		const filled = r * CIRCUMFERENCE;
		const ebikes = (station.num_ebikes_available ?? 0) > 0;

		return {
			ratio: r,
			colors: c,
			isActive: active,
			hasEbikes: ebikes,
			dashArray: `${filled} ${CIRCUMFERENCE - filled}`,
		};
	}, [station]);

	return (
		<svg
			aria-hidden="true"
			className="pointer-events-none block overflow-visible"
			height={PIN_SIZE}
			style={{
				filter: `drop-shadow(0 0 5px ${colors.glow})`,
				opacity: isActive ? 1 : 0.4,
			}}
			viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
			width={PIN_SIZE * (VIEWBOX_W / VIEWBOX_H)}
		>
			{/* Pin body — teardrop silhouette */}
			<path
				d={PIN_PATH}
				fill="rgba(2, 6, 23, 0.94)"
				stroke={isActive ? colors.fill : "rgba(100, 116, 139, 0.35)"}
				strokeOpacity={0.55}
				strokeWidth={1.2}
			/>

			{/* Ring track — faint guide circle inside the pin head */}
			<circle
				cx={HEAD_CX}
				cy={HEAD_CY}
				fill="none"
				r={RING_R}
				stroke="rgba(148, 163, 184, 0.1)"
				strokeWidth={RING_STROKE}
			/>

			{/* Availability arc — fills clockwise from 12 o'clock */}
			{ratio > 0 && isActive && (
				<circle
					cx={HEAD_CX}
					cy={HEAD_CY}
					fill="none"
					r={RING_R}
					stroke={colors.fill}
					strokeDasharray={dashArray}
					strokeDashoffset={CIRCUMFERENCE * 0.25}
					strokeLinecap="round"
					strokeWidth={RING_STROKE}
					style={{
						transition:
							"stroke-dasharray 600ms cubic-bezier(0.23,1,0.32,1), stroke 400ms ease-out",
					}}
					transform={`rotate(-90 ${HEAD_CX} ${HEAD_CY})`}
				/>
			)}

			{/* Center dot — availability color */}
			<circle
				cx={HEAD_CX}
				cy={HEAD_CY}
				fill={colors.dot}
				opacity={isActive ? 0.92 : 0.3}
				r={1.6}
			/>

			{/* eBike indicator — small bright tick mark at the top of the ring */}
			{hasEbikes && isActive && (
				<line
					stroke="rgba(250, 250, 250, 0.8)"
					strokeLinecap="round"
					strokeWidth={1.2}
					x1={HEAD_CX}
					x2={HEAD_CX}
					y1={HEAD_CY - RING_R - RING_STROKE * 0.5 - 0.6}
					y2={HEAD_CY - RING_R - RING_STROKE * 0.5 - 2}
				/>
			)}
		</svg>
	);
}
