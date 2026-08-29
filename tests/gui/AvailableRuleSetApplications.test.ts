import { AVAILABLE_RULE_SET_APPLICATIONS } from "../../src/gui/AvailableRuleSetApplications";

describe("AVAILABLE_RULE_SET_APPLICATIONS", () => {
  it("lists both rule-set-application strategies", () => {
    expect(AVAILABLE_RULE_SET_APPLICATIONS).toHaveLength(2);
  });

  it("lists the strategies by display name", () => {
    expect(AVAILABLE_RULE_SET_APPLICATIONS.map((option) => option.name)).toEqual([
      "Every player competes",
      "Only the owner or occupant",
    ]);
  });

  it("gives every entry a non-empty description", () => {
    for (const option of AVAILABLE_RULE_SET_APPLICATIONS) {
      expect(option.description.length).toBeGreaterThan(0);
    }
  });

  it("gives every entry a usable strategy instance", () => {
    for (const option of AVAILABLE_RULE_SET_APPLICATIONS) {
      expect(typeof option.strategy.buildCandidates).toBe("function");
      expect(typeof option.strategy.resolveOwner).toBe("function");
    }
  });
});
