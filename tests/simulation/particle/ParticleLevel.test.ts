import { ForceMatrix } from "../../../src/simulation/particle/ForceMatrix";
import { ParticleLevel } from "../../../src/simulation/particle/ParticleLevel";
import type { ParticlePopulation } from "../../../src/simulation/particle/ParticleLevel";

const MATRIX = ForceMatrix.create([1, 2], [
  [1, 0],
  [0, 1],
]);

const POPULATIONS: ParticlePopulation[] = [
  { type: 1, count: 5 },
  { type: 2, count: 3 },
];

function createLevel(populations: ParticlePopulation[] = POPULATIONS, seed = 9): ParticleLevel {
  return ParticleLevel.create(7, "Test", 60, 40, 10, populations, MATRIX, seed);
}

describe("ParticleLevel", () => {
  describe("createSimulation", () => {
    it("creates the configured number of particles of each type", () => {
      // Arrange
      const level = createLevel();

      // Act
      const counts = level.createSimulation().getTypeCounts();

      // Assert
      expect(counts).toEqual(new Map([[1, 5], [2, 3]]));
    });

    it("places every particle inside the world at rest", () => {
      // Arrange
      const level = createLevel();

      // Act
      const particles = level.createSimulation().getParticles();

      // Assert
      for (const particle of particles) {
        expect(particle.x).toBeGreaterThanOrEqual(0);
        expect(particle.x).toBeLessThan(60);
        expect(particle.y).toBeGreaterThanOrEqual(0);
        expect(particle.y).toBeLessThan(40);
        expect(particle.vx).toBe(0);
        expect(particle.vy).toBe(0);
      }
    });

    it("gives identical positions on every call", () => {
      // Arrange
      const level = createLevel();

      // Act
      const first = level.createSimulation().getParticles();
      const second = level.createSimulation().getParticles();

      // Assert
      expect(second).toEqual(first);
      expect(second[0]).not.toBe(first[0]);
    });

    it("gives different positions for a different seed", () => {
      // Arrange / Act
      const first = createLevel(POPULATIONS, 1).createSimulation().getParticles();
      const second = createLevel(POPULATIONS, 2).createSimulation().getParticles();

      // Assert
      expect(second).not.toEqual(first);
    });

    it("starts at generation 0 with the level's world", () => {
      // Arrange / Act
      const simulation = createLevel().createSimulation();

      // Assert
      expect(simulation.generation).toBe(0);
      expect(simulation.width).toBe(60);
      expect(simulation.height).toBe(40);
      expect(simulation.interactionRadius).toBe(10);
    });
  });

  describe("create", () => {
    it("exposes the level's data", () => {
      // Arrange / Act
      const level = createLevel();

      // Assert
      expect(level.id).toBe(7);
      expect(level.name).toBe("Test");
      expect(level.populations).toEqual(POPULATIONS);
      expect(level.forceMatrix).toBe(MATRIX);
      expect(level.seed).toBe(9);
    });

    it("throws RangeError when width is not positive", () => {
      expect(() => ParticleLevel.create(1, "x", 0, 40, 10, POPULATIONS, MATRIX, 1)).toThrow(RangeError);
    });

    it("throws RangeError when height is not positive", () => {
      expect(() => ParticleLevel.create(1, "x", 60, 0, 10, POPULATIONS, MATRIX, 1)).toThrow(RangeError);
    });

    it("throws RangeError when interactionRadius is not positive", () => {
      expect(() => ParticleLevel.create(1, "x", 60, 40, 0, POPULATIONS, MATRIX, 1)).toThrow(RangeError);
    });

    it("throws RangeError when populations is empty", () => {
      expect(() => createLevel([])).toThrow(RangeError);
    });

    it("throws RangeError when a count is not positive", () => {
      expect(() => createLevel([{ type: 1, count: 0 }])).toThrow(RangeError);
    });

    it("throws Error when a population's type is duplicated", () => {
      expect(() => createLevel([{ type: 1, count: 1 }, { type: 1, count: 2 }])).toThrow(
        "population types must be unique",
      );
    });

    it("throws RangeError when the seed is not an integer", () => {
      expect(() => createLevel(POPULATIONS, 0.5)).toThrow(RangeError);
    });
  });
});
