import { AVAILABLE_SIMULATION_MODES } from "../../src/gui/AvailableSimulationModes";

describe("AVAILABLE_SIMULATION_MODES", () => {
  it("lists both simulation modes", () => {
    expect(AVAILABLE_SIMULATION_MODES).toHaveLength(2);
  });

  it("lists the modes by display name", () => {
    expect(AVAILABLE_SIMULATION_MODES.map((option) => option.name)).toEqual([
      "Global simulation",
      "Player local simulation",
    ]);
  });

  it("offers the mode every game used before modes were selectable first", () => {
    expect(AVAILABLE_SIMULATION_MODES[0].requiresStartPositioning).toBe(false);
  });

  it("marks player local simulation as needing start positions", () => {
    expect(AVAILABLE_SIMULATION_MODES[1].requiresStartPositioning).toBe(true);
  });

  it("gives every entry a non-empty description", () => {
    for (const option of AVAILABLE_SIMULATION_MODES) {
      expect(option.description.length).toBeGreaterThan(0);
    }
  });

  it("gives every entry a usable mode instance", () => {
    for (const option of AVAILABLE_SIMULATION_MODES) {
      expect(typeof option.mode.nextGeneration).toBe("function");
    }
  });
});
