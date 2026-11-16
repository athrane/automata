import type { Particle } from "../../../src/simulation/particle/Particle";
import { SpatialHash } from "../../../src/simulation/particle/SpatialHash";

/** World extent on both axes: ten buckets of size 10. */
const WORLD_SIZE = 100;

/** Bucket size used by every test that does not exercise validation. */
const BUCKET_SIZE = 10;

function particleAt(x: number, y: number): Particle {
  return { x, y, vx: 0, vy: 0, type: 1 };
}

function nearbyOf(hash: SpatialHash, index: number): number[] {
  const visited: number[] = [];
  hash.forEachNearby(index, (neighbourIndex) => { visited.push(neighbourIndex); });

  return visited;
}

describe("SpatialHash", () => {
  describe("forEachNearby", () => {
    it("finds a particle in the same bucket", () => {
      // Arrange
      const hash = SpatialHash.create(WORLD_SIZE, WORLD_SIZE, BUCKET_SIZE);
      hash.rebuild([particleAt(51, 51), particleAt(58, 58)]);

      // Act / Assert
      expect(nearbyOf(hash, 0)).toEqual([1]);
    });

    it("finds a particle in an adjacent bucket", () => {
      // Arrange
      const hash = SpatialHash.create(WORLD_SIZE, WORLD_SIZE, BUCKET_SIZE);
      hash.rebuild([particleAt(55, 55), particleAt(65, 45)]);

      // Act / Assert
      expect(nearbyOf(hash, 0)).toEqual([1]);
    });

    it("finds a particle across a wrapped edge", () => {
      // Arrange
      const hash = SpatialHash.create(WORLD_SIZE, WORLD_SIZE, BUCKET_SIZE);
      hash.rebuild([particleAt(1, 1), particleAt(99, 99)]);

      // Act / Assert
      expect(nearbyOf(hash, 0)).toEqual([1]);
      expect(nearbyOf(hash, 1)).toEqual([0]);
    });

    it("does not report a particle two buckets away", () => {
      // Arrange
      const hash = SpatialHash.create(WORLD_SIZE, WORLD_SIZE, BUCKET_SIZE);
      hash.rebuild([particleAt(55, 55), particleAt(75, 55)]);

      // Act / Assert
      expect(nearbyOf(hash, 0)).toEqual([]);
    });

    it("visits each nearby particle once and never the particle itself", () => {
      // Arrange
      const hash = SpatialHash.create(WORLD_SIZE, WORLD_SIZE, BUCKET_SIZE);
      hash.rebuild([
        particleAt(55, 55),
        particleAt(45, 45),
        particleAt(56, 56),
        particleAt(65, 65),
        particleAt(54, 64),
      ]);

      // Act
      const visited = nearbyOf(hash, 0);

      // Assert
      expect([...visited].sort()).toEqual([1, 2, 3, 4]);
    });

    it("visits each particle once in the smallest allowed world", () => {
      // Arrange
      const hash = SpatialHash.create(30, 30, BUCKET_SIZE);
      hash.rebuild([particleAt(5, 5), particleAt(15, 15), particleAt(25, 25)]);

      // Act
      const visited = nearbyOf(hash, 1);

      // Assert
      expect([...visited].sort()).toEqual([0, 2]);
    });

    it("reflects positions from the latest rebuild", () => {
      // Arrange
      const hash = SpatialHash.create(WORLD_SIZE, WORLD_SIZE, BUCKET_SIZE);
      const particles = [particleAt(55, 55), particleAt(58, 58)];
      hash.rebuild(particles);
      particles[1].x = 85;

      // Act
      hash.rebuild(particles);

      // Assert
      expect(nearbyOf(hash, 0)).toEqual([]);
    });

    it("places a particle on the far edge in the last bucket", () => {
      // Arrange
      const hash = SpatialHash.create(WORLD_SIZE, WORLD_SIZE, BUCKET_SIZE);
      hash.rebuild([particleAt(WORLD_SIZE - Number.EPSILON, 50), particleAt(95, 50)]);

      // Act / Assert
      expect(nearbyOf(hash, 0)).toEqual([1]);
    });
  });

  describe("create", () => {
    it("throws RangeError when width is not positive", () => {
      expect(() => SpatialHash.create(0, WORLD_SIZE, BUCKET_SIZE)).toThrow(RangeError);
    });

    it("throws RangeError when height is not positive", () => {
      expect(() => SpatialHash.create(WORLD_SIZE, -1, BUCKET_SIZE)).toThrow(RangeError);
    });

    it("throws RangeError when bucketSize is not positive", () => {
      expect(() => SpatialHash.create(WORLD_SIZE, WORLD_SIZE, 0)).toThrow(RangeError);
    });

    it("throws RangeError when the world is narrower than three buckets", () => {
      expect(() => SpatialHash.create(29, WORLD_SIZE, BUCKET_SIZE)).toThrow(RangeError);
    });

    it("throws RangeError when the world is shorter than three buckets", () => {
      expect(() => SpatialHash.create(WORLD_SIZE, 20, BUCKET_SIZE)).toThrow(RangeError);
    });
  });
});
