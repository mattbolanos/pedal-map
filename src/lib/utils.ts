import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const SECOND_IN_MS = 1000;
const MINUTE_IN_MS = 60 * SECOND_IN_MS;
const HOUR_IN_MS = 60 * MINUTE_IN_MS;
const DAY_IN_MS = 24 * HOUR_IN_MS;
const MONTH_IN_MS = 30 * DAY_IN_MS;
const YEAR_IN_MS = 12 * MONTH_IN_MS;
const RELATIVE_TIME_UNITS = [
	{ unit: "second", maxMs: MINUTE_IN_MS, sizeMs: SECOND_IN_MS },
	{ unit: "minute", maxMs: HOUR_IN_MS, sizeMs: MINUTE_IN_MS },
	{ unit: "hour", maxMs: DAY_IN_MS, sizeMs: HOUR_IN_MS },
	{ unit: "day", maxMs: MONTH_IN_MS, sizeMs: DAY_IN_MS },
	{ unit: "month", maxMs: YEAR_IN_MS, sizeMs: MONTH_IN_MS },
] as const;

type RelativeTimeUnit = (typeof RELATIVE_TIME_UNITS)[number]["unit"];

export interface RelativeTimeValue {
	value: number;
	unit: RelativeTimeUnit;
}

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function isValidEpochSeconds(
	epochSeconds: number | undefined,
): epochSeconds is number {
	return typeof epochSeconds === "number" && Number.isFinite(epochSeconds);
}

export function getRelativeTime(
	epochSeconds: number | undefined,
	nowMs = Date.now(),
): string | null {
	if (!isValidEpochSeconds(epochSeconds)) return null;
	const relativeTimeValue = getRelativeTimeValue(epochSeconds, nowMs);
	if (relativeTimeValue) {
		return formatRelativeTimeValue(relativeTimeValue);
	}
	return "over a year ago";
}

export function getRelativeTimeValue(
	epochSeconds: number | undefined,
	nowMs = Date.now(),
): RelativeTimeValue | null {
	if (!isValidEpochSeconds(epochSeconds)) return null;
	const diffMs = Math.max(0, nowMs - epochSeconds * SECOND_IN_MS);

	for (const { unit, maxMs, sizeMs } of RELATIVE_TIME_UNITS) {
		if (diffMs < maxMs) {
			return {
				value: Math.floor(diffMs / sizeMs),
				unit,
			};
		}
	}

	return null;
}

export function getRelativeTimeRefreshDelay(
	epochSeconds: number | undefined,
	nowMs = Date.now(),
): number | null {
	if (!isValidEpochSeconds(epochSeconds)) return null;
	const elapsedMs = Math.max(0, nowMs - epochSeconds * SECOND_IN_MS);

	if (elapsedMs < MINUTE_IN_MS) {
		return getTimeUntilNextBoundary(elapsedMs, SECOND_IN_MS);
	}

	if (elapsedMs < HOUR_IN_MS) {
		return getTimeUntilNextBoundary(elapsedMs, MINUTE_IN_MS);
	}

	if (elapsedMs < DAY_IN_MS) {
		return getTimeUntilNextBoundary(elapsedMs, HOUR_IN_MS);
	}

	if (elapsedMs < MONTH_IN_MS) {
		return getTimeUntilNextBoundary(elapsedMs, DAY_IN_MS);
	}

	if (elapsedMs < YEAR_IN_MS) {
		return getTimeUntilNextBoundary(elapsedMs, MONTH_IN_MS);
	}

	return null;
}

function getTimeUntilNextBoundary(elapsedMs: number, unitMs: number): number {
	const remainder = elapsedMs % unitMs;
	return remainder === 0 ? unitMs : unitMs - remainder;
}

export function formatRelativeTimeValue({
	value,
	unit,
}: RelativeTimeValue): string {
	return `${value} ${unit}${value === 1 ? "" : "s"} ago`;
}
