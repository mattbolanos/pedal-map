import { describe, expect, it } from "vitest";
import { assignNeighborhoodBucket } from "./neighborhood-bucket";

describe("assignNeighborhoodBucket", () => {
	it("returns neighborhood buckets for known core areas", () => {
		expect(assignNeighborhoodBucket(40.7465, -74.0014)).toBe("chelsea");
		expect(assignNeighborhoodBucket(40.7265, -73.9815)).toBe("eastVillage");
		expect(assignNeighborhoodBucket(40.7033, -73.9891)).toBe("dumbo");
		expect(assignNeighborhoodBucket(40.6778, -73.9682)).toBe("prospectHeights");
		expect(assignNeighborhoodBucket(40.6694, -73.9442)).toBe("crownHeights");
		expect(assignNeighborhoodBucket(40.7081, -73.9571)).toBe("williamsburg");
		expect(assignNeighborhoodBucket(40.7294, -73.9543)).toBe("greenpoint");
		expect(assignNeighborhoodBucket(40.7447, -73.9485)).toBe("longIslandCity");
		expect(assignNeighborhoodBucket(40.7644, -73.9235)).toBe("astoria");
	});

	it("keeps the broad region labels as fallback buckets", () => {
		expect(assignNeighborhoodBucket(40.719, -74.043)).toBe("jerseyCity");
		expect(assignNeighborhoodBucket(40.7433, -74.0324)).toBe("hoboken");
		expect(assignNeighborhoodBucket(40.759, -73.8303)).toBe("nyc");
		expect(assignNeighborhoodBucket(40.9312, -73.8988)).toBe("nyc");
		expect(assignNeighborhoodBucket(40.61124, -74.03282)).toBe("nyc");
	});
});
