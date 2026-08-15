import { AVAILABLE_START_POSITIONINGS } from "../../src/gui/AvailableStartPositionings";

describe("AVAILABLE_START_POSITIONINGS", () => {
  it("lists both positioning strategies", () => {
    expect(AVAILABLE_START_POSITIONINGS).toHaveLength(2);
  });

  it("lists the strategies by display name", () => {
    expect(AVAILABLE_START_POSITIONINGS.map((option) => option.name)).toEqual([
      "First claimed cell",
      "Random claimed cell",
    ]);
  });

  it("gives every entry a non-empty description", () => {
    for (const option of AVAILABLE_START_POSITIONINGS) {
      expect(option.description.length).toBeGreaterThan(0);
    }
  });

  it("gives every entry a usable strategy instance", () => {
    for (const option of AVAILABLE_START_POSITIONINGS) {
      expect(typeof option.strategy.selectPosition).toBe("function");
    }
  });
});
