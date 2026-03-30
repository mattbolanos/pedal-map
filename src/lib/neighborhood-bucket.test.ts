import { describe, expect, it } from "vitest";
import {
	assignNeighborhoodBucket,
	getNeighborhoodBucketMeta,
} from "./neighborhood-bucket";

describe("assignNeighborhoodBucket", () => {
	it("returns Bay Ridge for points inside the new polygon", () => {
		expect(assignNeighborhoodBucket(40.6248, -74.0288)).toBe("bayRidge");
		expect(assignNeighborhoodBucket(40.6332, -74.0204)).toBe("bayRidge");
	});

	it("keeps the broad region labels as fallback buckets", () => {
		expect(assignNeighborhoodBucket(40.719, -74.043)).toBe("jerseyCity");
		expect(assignNeighborhoodBucket(40.7433, -74.0324)).toBe("hoboken");
		expect(assignNeighborhoodBucket(40.759, -73.8303)).toBe("nyc");
		expect(assignNeighborhoodBucket(40.9312, -73.8988)).toBe("nyc");
		expect(assignNeighborhoodBucket(40.6778, -73.9682)).toBe("nyc");
	});

	it("derives neighborhood labels from the region registry", () => {
		expect(getNeighborhoodBucketMeta("bayRidge")).toEqual({
			label: "Bay Ridge",
		});
	});
});
