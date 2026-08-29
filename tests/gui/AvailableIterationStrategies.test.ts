import { AVAILABLE_ITERATION_STRATEGIES } from "../../src/gui/AvailableIterationStrategies";

describe("AVAILABLE_ITERATION_STRATEGIES", () => {
  it("lists both iteration strategies", () => {
    expect(AVAILABLE_ITERATION_STRATEGIES).toHaveLength(2);
  });

  it("lists the strategies by display name", () => {
    expect(AVAILABLE_ITERATION_STRATEGIES.map((option) => option.name)).toEqual([
      "Sweep every cell",
      "Owned and occupied cells",
    ]);
  });

  it("offers the strategy matching the default mode first", () => {
    expect(AVAILABLE_ITERATION_STRATEGIES[0].requiresStartPositioning).toBe(false);
  });

  it("marks the owned-and-occupied strategy as needing start positions", () => {
    expect(AVAILABLE_ITERATION_STRATEGIES[1].requiresStartPositioning).toBe(true);
  });

  it("gives every entry a non-empty description", () => {
    for (const option of AVAILABLE_ITERATION_STRATEGIES) {
      expect(option.description.length).toBeGreaterThan(0);
    }
  });

  it("gives every entry a usable strategy instance", () => {
    for (const option of AVAILABLE_ITERATION_STRATEGIES) {
      expect(typeof option.strategy.cellsToVisit).toBe("function");
    }
  });
});
