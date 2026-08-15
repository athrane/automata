import { AVAILABLE_STARTING_PATTERNS } from "../../src/gui/AvailableStartingPatterns";
import { LEVEL_ONE_STARTING_PATTERN } from "../../src/simulation";

describe("AVAILABLE_STARTING_PATTERNS", () => {
  it("lists three starting patterns", () => {
    expect(AVAILABLE_STARTING_PATTERNS).toHaveLength(3);
  });

  it("lists the patterns by display name", () => {
    expect(AVAILABLE_STARTING_PATTERNS.map((option) => option.name)).toEqual([
      "Checker",
      "Spread rectangles",
      "Centre cluster",
    ]);
  });

  it("reuses Level 1's exact checker pattern instance", () => {
    expect(AVAILABLE_STARTING_PATTERNS[0].pattern).toBe(LEVEL_ONE_STARTING_PATTERN);
  });
});
