import { SeededRandom } from "../../../src/simulation/particle/SeededRandom";

/** Number of values drawn when comparing or range-checking sequences. */
const SAMPLE_SIZE = 1000;

function draw(random: SeededRandom, count: number): number[] {
  return Array.from({ length: count }, () => random.next());
}

describe("SeededRandom", () => {
  describe("next", () => {
    it("produces the same sequence for the same seed", () => {
      // Arrange
      const first = SeededRandom.create(42);
      const second = SeededRandom.create(42);

      // Act
      const firstValues = draw(first, SAMPLE_SIZE);
      const secondValues = draw(second, SAMPLE_SIZE);

      // Assert
      expect(firstValues).toEqual(secondValues);
    });

    it("produces different sequences for different seeds", () => {
      // Arrange
      const first = SeededRandom.create(1);
      const second = SeededRandom.create(2);

      // Act
      const firstValues = draw(first, SAMPLE_SIZE);
      const secondValues = draw(second, SAMPLE_SIZE);

      // Assert
      expect(firstValues).not.toEqual(secondValues);
    });

    it("keeps every value in [0, 1)", () => {
      // Arrange
      const random = SeededRandom.create(7);

      // Act
      const values = draw(random, SAMPLE_SIZE);

      // Assert
      expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
    });

    it("does not repeat a single value", () => {
      // Arrange
      const random = SeededRandom.create(0);

      // Act
      const values = draw(random, SAMPLE_SIZE);

      // Assert
      expect(new Set(values).size).toBeGreaterThan(SAMPLE_SIZE - 10);
    });
  });

  describe("create", () => {
    it("accepts a negative integer seed", () => {
      expect(() => SeededRandom.create(-5)).not.toThrow();
    });

    it("throws RangeError when the seed is not an integer", () => {
      expect(() => SeededRandom.create(1.5)).toThrow(RangeError);
    });

    it("throws RangeError when the seed is NaN", () => {
      expect(() => SeededRandom.create(Number.NaN)).toThrow(RangeError);
    });
  });
});
