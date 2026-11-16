import { AVAILABLE_RULE_PRESETS } from "../../src/gui/AvailableRulePresets";

describe("AVAILABLE_RULE_PRESETS", () => {
  it("lists the eight sum presets and the three conversion presets", () => {
    expect(AVAILABLE_RULE_PRESETS).toHaveLength(11);
  });

  it("gives every preset a unique name", () => {
    const names = AVAILABLE_RULE_PRESETS.map((preset) => preset.name);

    expect(new Set(names).size).toBe(names.length);
  });

  it("gives every preset a non-empty description", () => {
    for (const preset of AVAILABLE_RULE_PRESETS) {
      expect(preset.description.length).toBeGreaterThan(0);
    }
  });

  it("appends the conversion presets after the sum presets", () => {
    expect(AVAILABLE_RULE_PRESETS.slice(-3).map((preset) => preset.name)).toEqual([
      "Overrun at 3+",
      "Infiltrate at 1–2",
      "Settle at 1+",
    ]);
  });

  it("keeps the first preset unchanged", () => {
    expect(AVAILABLE_RULE_PRESETS[0].name).toBe("Born at 3");
  });
});
