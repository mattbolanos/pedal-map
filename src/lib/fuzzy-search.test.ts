import { describe, expect, it } from "vitest";
import {
  createFuzzySearchValue,
  getFuzzySearchScore,
  normalizeFuzzySearchText,
} from "./fuzzy-search";

describe("normalizeFuzzySearchText", () => {
  it("normalizes case and separators", () => {
    expect(normalizeFuzzySearchText("W 52 St. / 11 Ave")).toBe(
      "w 52 st 11 ave",
    );
  });
});

describe("getFuzzySearchScore", () => {
  it("matches tokenized queries with normalized separators", () => {
    expect(getFuzzySearchScore("W 52 St / 11 Ave", "52 11")).not.toBeNull();
  });

  it("returns null when a token does not match", () => {
    expect(getFuzzySearchScore("W 52 St / 11 Ave", "queens")).toBeNull();
  });

  it("accepts precomputed values", () => {
    const searchableValue = createFuzzySearchValue("Central Park North");
    const queryValue = createFuzzySearchValue("central");

    expect(getFuzzySearchScore(searchableValue, queryValue)).toBe(
      getFuzzySearchScore("Central Park North", "central"),
    );
  });

  it("scores in-order token matches higher", () => {
    const searchableValue = createFuzzySearchValue("west 52 street 11 avenue");

    expect(getFuzzySearchScore(searchableValue, "52 11")).toBeGreaterThan(
      getFuzzySearchScore(searchableValue, "11 52") ?? Number.NEGATIVE_INFINITY,
    );
  });
});
