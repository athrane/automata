import { resolveParticleTimeStep } from "../../src/gui/ParticleTimeStep";

describe("resolveParticleTimeStep", () => {
  it("returns the base step of 1 for one frame per generation", () => {
    expect(resolveParticleTimeStep(1)).toBe(1);
  });

  it("returns a sixteenth of the base step for sixteen frames per generation", () => {
    expect(resolveParticleTimeStep(16)).toBe(1 / 16);
  });

  it("throws RangeError when frames per generation is less than 1", () => {
    expect(() => resolveParticleTimeStep(0.5)).toThrow(RangeError);
  });

  it("throws RangeError when frames per generation is NaN", () => {
    expect(() => resolveParticleTimeStep(Number.NaN)).toThrow(RangeError);
  });
});
