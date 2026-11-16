import { ForceMatrix } from "../../../src/simulation/particle/ForceMatrix";
import { ParticleLifeForceLaw } from "../../../src/simulation/particle/ParticleLifeForceLaw";
import { ParticleSimulationOptions } from "../../../src/simulation/particle/ParticleSimulationOptions";

const MATRIX = ForceMatrix.create([1], [[1]]);

describe("ParticleSimulationOptions", () => {
  describe("create", () => {
    it("keeps the given world and radius", () => {
      // Arrange / Act
      const options = ParticleSimulationOptions.create(120, 90, 10, MATRIX);

      // Assert
      expect(options.width).toBe(120);
      expect(options.height).toBe(90);
      expect(options.interactionRadius).toBe(10);
      expect(options.forceMatrix).toBe(MATRIX);
    });

    it("defaults to the particle-life force law with a repulsion ratio of 0.3", () => {
      // Arrange / Act
      const options = ParticleSimulationOptions.create(100, 100, 10, MATRIX);

      // Assert
      expect(options.forceLaw).toBeInstanceOf(ParticleLifeForceLaw);
      expect((options.forceLaw as ParticleLifeForceLaw).repulsionRatio).toBe(0.3);
    });

    it("defaults friction to 0.75 and force scale to 0.05", () => {
      // Arrange / Act
      const options = ParticleSimulationOptions.create(100, 100, 10, MATRIX);

      // Assert
      expect(options.friction).toBe(0.75);
      expect(options.forceScale).toBe(0.05);
    });

    it("keeps a given force law, friction and force scale", () => {
      // Arrange
      const law = ParticleLifeForceLaw.create(0.5);

      // Act
      const options = ParticleSimulationOptions.create(100, 100, 10, MATRIX, law, 1, 2);

      // Assert
      expect(options.forceLaw).toBe(law);
      expect(options.friction).toBe(1);
      expect(options.forceScale).toBe(2);
    });

    it("throws RangeError when width is not positive", () => {
      expect(() => ParticleSimulationOptions.create(0, 100, 10, MATRIX)).toThrow(RangeError);
    });

    it("throws RangeError when height is not positive", () => {
      expect(() => ParticleSimulationOptions.create(100, -5, 10, MATRIX)).toThrow(RangeError);
    });

    it("throws RangeError when interactionRadius is not positive", () => {
      expect(() => ParticleSimulationOptions.create(100, 100, 0, MATRIX)).toThrow(RangeError);
    });

    it("throws RangeError when the world spans fewer than three radii", () => {
      expect(() => ParticleSimulationOptions.create(100, 29, 10, MATRIX)).toThrow(RangeError);
    });

    it("throws RangeError when friction is 0", () => {
      expect(() => ParticleSimulationOptions.create(100, 100, 10, MATRIX, undefined, 0)).toThrow(RangeError);
    });

    it("throws RangeError when friction is above 1", () => {
      expect(() => ParticleSimulationOptions.create(100, 100, 10, MATRIX, undefined, 1.1)).toThrow(RangeError);
    });

    it("throws RangeError when forceScale is not positive", () => {
      expect(() => ParticleSimulationOptions.create(100, 100, 10, MATRIX, undefined, 0.5, 0)).toThrow(RangeError);
    });
  });
});
