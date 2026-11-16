import { ParticleLifeForceLaw } from "../../../src/simulation/particle/ParticleLifeForceLaw";

/** Repulsion ratio used by every test that does not exercise validation. */
const REPULSION_RATIO = 0.4;

/** Distance ratio halfway between the repulsion ratio and 1, where attraction peaks. */
const PEAK_RATIO = (1 + REPULSION_RATIO) / 2;

describe("ParticleLifeForceLaw", () => {
  describe("magnitude", () => {
    it("repels with -1 at zero distance", () => {
      // Arrange
      const law = ParticleLifeForceLaw.create(REPULSION_RATIO);

      // Act / Assert
      expect(law.magnitude(0, 1)).toBe(-1);
    });

    it("repels below the repulsion ratio regardless of attraction", () => {
      // Arrange
      const law = ParticleLifeForceLaw.create(REPULSION_RATIO);

      // Act
      const attracting = law.magnitude(REPULSION_RATIO / 2, 1);
      const repelling = law.magnitude(REPULSION_RATIO / 2, -1);

      // Assert
      expect(attracting).toBeCloseTo(-0.5);
      expect(repelling).toBeCloseTo(-0.5);
    });

    it("is zero at the repulsion ratio", () => {
      // Arrange
      const law = ParticleLifeForceLaw.create(REPULSION_RATIO);

      // Act / Assert
      expect(law.magnitude(REPULSION_RATIO, 1)).toBeCloseTo(0);
    });

    it("peaks at the full attraction midway between the repulsion ratio and 1", () => {
      // Arrange
      const law = ParticleLifeForceLaw.create(REPULSION_RATIO);

      // Act / Assert
      expect(law.magnitude(PEAK_RATIO, 0.8)).toBeCloseTo(0.8);
    });

    it("is half the attraction a quarter of the band in from either end", () => {
      // Arrange
      const law = ParticleLifeForceLaw.create(REPULSION_RATIO);
      const quarterBand = (1 - REPULSION_RATIO) / 4;

      // Act / Assert
      expect(law.magnitude(REPULSION_RATIO + quarterBand, 1)).toBeCloseTo(0.5);
      expect(law.magnitude(1 - quarterBand, 1)).toBeCloseTo(0.5);
    });

    it("is zero at a distance ratio of 1", () => {
      // Arrange
      const law = ParticleLifeForceLaw.create(REPULSION_RATIO);

      // Act / Assert
      expect(law.magnitude(1, 1)).toBe(0);
    });

    it("is zero beyond a distance ratio of 1", () => {
      // Arrange
      const law = ParticleLifeForceLaw.create(REPULSION_RATIO);

      // Act / Assert
      expect(law.magnitude(1.5, -1)).toBe(0);
    });

    it("follows the sign of the attraction in the attraction band", () => {
      // Arrange
      const law = ParticleLifeForceLaw.create(REPULSION_RATIO);

      // Act / Assert
      expect(law.magnitude(PEAK_RATIO, 0.5)).toBeGreaterThan(0);
      expect(law.magnitude(PEAK_RATIO, -0.5)).toBeLessThan(0);
      expect(law.magnitude(PEAK_RATIO, 0)).toBeCloseTo(0);
    });
  });

  describe("create", () => {
    it("exposes the repulsion ratio", () => {
      expect(ParticleLifeForceLaw.create(REPULSION_RATIO).repulsionRatio).toBe(REPULSION_RATIO);
    });

    it("throws RangeError when the repulsion ratio is 0", () => {
      expect(() => ParticleLifeForceLaw.create(0)).toThrow(RangeError);
    });

    it("throws RangeError when the repulsion ratio is 1", () => {
      expect(() => ParticleLifeForceLaw.create(1)).toThrow(RangeError);
    });

    it("throws RangeError when the repulsion ratio is negative", () => {
      expect(() => ParticleLifeForceLaw.create(-0.2)).toThrow(RangeError);
    });

    it("throws RangeError when the repulsion ratio is NaN", () => {
      expect(() => ParticleLifeForceLaw.create(Number.NaN)).toThrow(RangeError);
    });
  });
});
