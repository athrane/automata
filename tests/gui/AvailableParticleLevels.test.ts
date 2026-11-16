import { AVAILABLE_PARTICLE_LEVELS } from "../../src/gui/AvailableParticleLevels";

describe("AVAILABLE_PARTICLE_LEVELS", () => {
  it("lists the particle levels in id order", () => {
    expect(AVAILABLE_PARTICLE_LEVELS.map((level) => level.id)).toEqual([1]);
  });

  it("lists the particle levels by their display names", () => {
    expect(AVAILABLE_PARTICLE_LEVELS.map((level) => level.name)).toEqual(["Particle level 1"]);
  });
});
