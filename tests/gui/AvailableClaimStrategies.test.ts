import { AVAILABLE_CLAIM_STRATEGIES } from "../../src/gui/AvailableClaimStrategies";

describe("AVAILABLE_CLAIM_STRATEGIES", () => {
  it("lists all six claim strategies", () => {
    expect(AVAILABLE_CLAIM_STRATEGIES).toHaveLength(6);
  });

  it("lists the strategies by display name", () => {
    expect(AVAILABLE_CLAIM_STRATEGIES.map((option) => option.name)).toEqual([
      "First match",
      "Incumbent defends",
      "Strongest match",
      "Neighbour majority",
      "Rotating priority",
      "Contested cells stay empty",
    ]);
  });

  it("gives every entry a usable strategy instance", () => {
    for (const option of AVAILABLE_CLAIM_STRATEGIES) {
      expect(typeof option.strategy.selectWinner).toBe("function");
    }
  });
});
