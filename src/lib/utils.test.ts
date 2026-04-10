import { describe, expect, it } from "vitest";

import {
	formatRelativeTimeValue,
	getRelativeTime,
	getRelativeTimeRefreshDelay,
	getRelativeTimeValue,
	isValidEpochSeconds,
} from "./utils";

describe("getRelativeTime", () => {
	it("counts up in seconds for the first minute", () => {
		const nowMs = 100_000;
		const thirtySecondsAgo = 70;

		expect(getRelativeTime(thirtySecondsAgo, nowMs)).toBe("30 seconds ago");
		expect(getRelativeTime(thirtySecondsAgo, nowMs + 1_000)).toBe(
			"31 seconds ago",
		);
	});

	it("clamps future timestamps to zero seconds ago", () => {
		expect(getRelativeTime(110, 100_000)).toBe("0 seconds ago");
	});

	it("returns null for invalid epoch seconds", () => {
		expect(getRelativeTime(Number.NaN, 100_000)).toBeNull();
	});
});

describe("getRelativeTimeValue", () => {
	it("returns seconds while under a minute", () => {
		expect(getRelativeTimeValue(70, 100_000)).toEqual({
			value: 30,
			unit: "second",
		});
	});

	it("returns minutes once over a minute", () => {
		expect(getRelativeTimeValue(0, 125_000)).toEqual({
			value: 2,
			unit: "minute",
		});
	});

	it("returns null once the display becomes static", () => {
		const thirteenMonthsAgo = 0;
		const nowMs = 13 * 30 * 24 * 60 * 60 * 1000;

		expect(getRelativeTimeValue(thirteenMonthsAgo, nowMs)).toBeNull();
	});
});

describe("getRelativeTimeRefreshDelay", () => {
	it("updates on the next second boundary while under a minute", () => {
		expect(getRelativeTimeRefreshDelay(70, 100_250)).toBe(750);
	});

	it("updates on the next minute boundary once in minute mode", () => {
		expect(getRelativeTimeRefreshDelay(0, 125_000)).toBe(55_000);
	});

	it("stops refreshing once the label no longer changes", () => {
		const thirteenMonthsAgo = 0;
		const nowMs = 13 * 30 * 24 * 60 * 60 * 1000;

		expect(getRelativeTimeRefreshDelay(thirteenMonthsAgo, nowMs)).toBeNull();
	});

	it("returns null for invalid epoch seconds", () => {
		expect(getRelativeTimeRefreshDelay(Number.NaN, 100_000)).toBeNull();
	});
});

describe("isValidEpochSeconds", () => {
	it("rejects non-finite values", () => {
		expect(isValidEpochSeconds(undefined)).toBe(false);
		expect(isValidEpochSeconds(Number.NaN)).toBe(false);
		expect(isValidEpochSeconds(Number.POSITIVE_INFINITY)).toBe(false);
		expect(isValidEpochSeconds(100)).toBe(true);
	});
});

describe("formatRelativeTimeValue", () => {
	it("formats the numeric display label", () => {
		expect(formatRelativeTimeValue({ value: 1, unit: "minute" })).toBe(
			"1 minute ago",
		);
		expect(formatRelativeTimeValue({ value: 2, unit: "second" })).toBe(
			"2 seconds ago",
		);
	});
});
