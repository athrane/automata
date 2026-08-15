import { AVAILABLE_LEVELS } from "../../src/gui/AvailableLevels";

describe("AVAILABLE_LEVELS", () => {
  it("lists the three fixed levels in id order", () => {
    expect(AVAILABLE_LEVELS.map((level) => level.id)).toEqual([1, 2, 3]);
  });

  it("lists the levels by their display names", () => {
    expect(AVAILABLE_LEVELS.map((level) => level.name)).toEqual([
      "Level 1",
      "Level 2",
      "Level 3",
    ]);
  });
});
