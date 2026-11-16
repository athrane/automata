import { ForceMatrix } from "../../../src/simulation/particle/ForceMatrix";
import type { Particle } from "../../../src/simulation/particle/Particle";
import { ParticleSimulation } from "../../../src/simulation/particle/ParticleSimulation";
import { ParticleSimulationOptions } from "../../../src/simulation/particle/ParticleSimulationOptions";

/** World extent on both axes. */
const WORLD_SIZE = 100;

/** Interaction radius; the default repulsion ratio of 0.3 puts the repulsion distance at 3. */
const RADIUS = 10;

/** Time step used by every test that does not exercise validation. */
const TIME_STEP = 1;

function particleAt(x: number, y: number, type = 1): Particle {
  return { x, y, vx: 0, vy: 0, type };
}

function simulationOf(attraction: number, particles: Particle[]): ParticleSimulation {
  const options = ParticleSimulationOptions.create(
    WORLD_SIZE,
    WORLD_SIZE,
    RADIUS,
    ForceMatrix.create([1], [[attraction]]),
  );

  return ParticleSimulation.create(options, particles);
}

describe("ParticleSimulation", () => {
  describe("step", () => {
    it("moves two attracting particles closer", () => {
      // Arrange
      const left = particleAt(50, 50);
      const right = particleAt(56, 50);
      const simulation = simulationOf(1, [left, right]);

      // Act
      simulation.step(TIME_STEP);

      // Assert
      expect(right.x - left.x).toBeLessThan(6);
    });

    it("moves two repelling particles apart", () => {
      // Arrange
      const left = particleAt(50, 50);
      const right = particleAt(56, 50);
      const simulation = simulationOf(-1, [left, right]);

      // Act
      simulation.step(TIME_STEP);

      // Assert
      expect(right.x - left.x).toBeGreaterThan(6);
    });

    it("separates two particles closer than the repulsion distance even when they attract", () => {
      // Arrange
      const lower = particleAt(50, 50);
      const upper = particleAt(50, 52);
      const simulation = simulationOf(1, [lower, upper]);

      // Act
      simulation.step(TIME_STEP);

      // Assert
      expect(upper.y - lower.y).toBeGreaterThan(2);
    });

    it("leaves particles beyond the interaction radius unaffected", () => {
      // Arrange
      const left = particleAt(50, 50);
      const right = particleAt(50 + RADIUS + 1, 50);
      const simulation = simulationOf(1, [left, right]);

      // Act
      simulation.step(TIME_STEP);

      // Assert
      expect(left).toEqual(particleAt(50, 50));
      expect(right).toEqual(particleAt(50 + RADIUS + 1, 50));
    });

    it("re-enters a particle leaving one edge at the opposite one", () => {
      // Arrange
      const particle: Particle = { x: 99.5, y: 0.5, vx: 2, vy: -2, type: 1 };
      const simulation = simulationOf(0, [particle]);

      // Act
      simulation.step(TIME_STEP);

      // Assert
      expect(particle.x).toBeCloseTo(1);
      expect(particle.y).toBeCloseTo(99);
    });

    it("applies forces across a wrapped edge", () => {
      // Arrange
      const nearRight = particleAt(98, 50);
      const nearLeft = particleAt(4, 50);
      const simulation = simulationOf(1, [nearRight, nearLeft]);

      // Act
      simulation.step(TIME_STEP);

      // Assert
      expect(nearRight.vx).toBeGreaterThan(0);
      expect(nearLeft.vx).toBeLessThan(0);
    });

    it("computes every force from the positions before the step", () => {
      // Arrange
      const left = particleAt(50, 50);
      const right = particleAt(56, 50);
      const simulation = simulationOf(1, [left, right]);

      // Act
      simulation.step(TIME_STEP);

      // Assert
      expect(left.x - 50).toBeGreaterThan(0);
      expect(left.x - 50).toBeCloseTo(56 - right.x, 12);
    });

    it("damps velocity by friction raised to the time step", () => {
      // Arrange
      const particle: Particle = { x: 50, y: 50, vx: 1, vy: 0, type: 1 };
      const options = ParticleSimulationOptions.create(
        WORLD_SIZE,
        WORLD_SIZE,
        RADIUS,
        ForceMatrix.create([1], [[0]]),
        undefined,
        0.25,
      );
      const simulation = ParticleSimulation.create(options, [particle]);

      // Act
      simulation.step(0.5);

      // Assert
      expect(particle.vx).toBeCloseTo(0.5);
      expect(particle.x).toBeCloseTo(50.25);
    });

    it("does not move a particle sharing another's position", () => {
      // Arrange
      const first = particleAt(50, 50);
      const second = particleAt(50, 50);
      const simulation = simulationOf(1, [first, second]);

      // Act
      simulation.step(TIME_STEP);

      // Assert
      expect(first).toEqual(particleAt(50, 50));
    });

    it("throws RangeError when timeStep is 0", () => {
      // Arrange
      const simulation = simulationOf(1, [particleAt(50, 50)]);

      // Act / Assert
      expect(() => simulation.step(0)).toThrow(RangeError);
    });

    it("throws RangeError when timeStep is negative", () => {
      // Arrange
      const simulation = simulationOf(1, [particleAt(50, 50)]);

      // Act / Assert
      expect(() => simulation.step(-1)).toThrow(RangeError);
    });
  });

  describe("generation", () => {
    it("starts at 0", () => {
      expect(simulationOf(1, []).generation).toBe(0);
    });

    it("counts the steps taken", () => {
      // Arrange
      const simulation = simulationOf(1, [particleAt(50, 50)]);

      // Act
      simulation.step(TIME_STEP);
      simulation.step(TIME_STEP);
      simulation.step(TIME_STEP);

      // Assert
      expect(simulation.generation).toBe(3);
    });
  });

  describe("getParticles", () => {
    it("returns the particles in the order given", () => {
      // Arrange
      const first = particleAt(10, 10);
      const second = particleAt(20, 20);

      // Act
      const particles = simulationOf(1, [first, second]).getParticles();

      // Assert
      expect(particles).toEqual([first, second]);
    });
  });

  describe("getTypeCounts", () => {
    it("counts the particles of each type", () => {
      // Arrange
      const simulation = simulationOf(1, [
        particleAt(10, 10, 1),
        particleAt(20, 20, 2),
        particleAt(30, 30, 2),
      ]);

      // Act
      const counts = simulation.getTypeCounts();

      // Assert
      expect(counts).toEqual(new Map([[1, 1], [2, 2]]));
    });
  });

  describe("create", () => {
    it("exposes the world and the interaction radius", () => {
      // Arrange / Act
      const simulation = simulationOf(1, []);

      // Assert
      expect(simulation.width).toBe(WORLD_SIZE);
      expect(simulation.height).toBe(WORLD_SIZE);
      expect(simulation.interactionRadius).toBe(RADIUS);
    });
  });
});
