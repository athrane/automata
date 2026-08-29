import { AVAILABLE_SIMULATION_MODES } from "../../src/gui/AvailableSimulationModes";
import {
  requiresStartPositioning,
  resolveSimulationMode,
} from "../../src/gui/CustomSimulationModeSelection";

describe("resolveSimulationMode", () => {
  it("returns the preset's own mode instance when not custom", () => {
    expect(resolveSimulationMode(false, 0, 0, 0)).toBe(AVAILABLE_SIMULATION_MODES[0].mode);
    expect(resolveSimulationMode(false, 1, 0, 0)).toBe(AVAILABLE_SIMULATION_MODES[1].mode);
  });

  it("returns a distinct usable mode when custom", () => {
    const mode = resolveSimulationMode(true, 0, 0, 0);

    expect(mode).not.toBe(AVAILABLE_SIMULATION_MODES[0].mode);
    expect(typeof mode.nextGeneration).toBe("function");
  });

  it("returns a new instance for every custom call", () => {
    const first = resolveSimulationMode(true, 0, 0, 0);
    const second = resolveSimulationMode(true, 0, 0, 0);

    expect(first).not.toBe(second);
  });
});

describe("requiresStartPositioning", () => {
  it("follows the mode option when not custom", () => {
    expect(requiresStartPositioning(false, 0, 0)).toBe(AVAILABLE_SIMULATION_MODES[0].requiresStartPositioning);
    expect(requiresStartPositioning(false, 1, 0)).toBe(AVAILABLE_SIMULATION_MODES[1].requiresStartPositioning);
  });

  it("follows the iteration strategy when custom", () => {
    expect(requiresStartPositioning(true, 0, 0)).toBe(false);
    expect(requiresStartPositioning(true, 0, 1)).toBe(true);
  });
});
