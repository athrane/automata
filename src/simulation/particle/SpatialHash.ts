import type { Particle } from "./Particle";

/**
 * Fewest buckets the world may have along an axis. With fewer, the 3x3 block
 * around a bucket would wrap onto itself and visit a bucket twice.
 */
const MINIMUM_BUCKETS_PER_AXIS = 3;

/** Bucket offsets visited on each axis around a particle's own bucket. */
const NEIGHBOUR_OFFSETS: ReadonlyArray<number> = [-1, 0, 1];

/**
 * Groups particles into square-ish buckets so a particle's neighbours can be
 * found without comparing every pair.
 *
 * Buckets are at least `bucketSize` wide on each axis, so every particle
 * within `bucketSize` of another lies in the 3x3 block of buckets around it.
 * The block wraps at the world's edges.
 *
 * Use the static factory method {@link SpatialHash.create} to construct an instance.
 */
export class SpatialHash {
  private readonly columns: number;
  private readonly rows: number;
  private readonly bucketWidth: number;
  private readonly bucketHeight: number;
  /** Index into {@link sortedIndices} where each bucket starts; one extra entry marks the end. */
  private readonly bucketStart: Int32Array;
  /** Particle indices grouped by bucket. */
  private sortedIndices: Int32Array;
  /** Bucket each particle was placed in by the last {@link rebuild}. */
  private particleBucket: Int32Array;

  private constructor(width: number, height: number, columns: number, rows: number) {
    this.columns = columns;
    this.rows = rows;
    this.bucketWidth = width / columns;
    this.bucketHeight = height / rows;
    this.bucketStart = new Int32Array(columns * rows + 1);
    this.sortedIndices = new Int32Array(0);
    this.particleBucket = new Int32Array(0);
  }

  /**
   * Creates a {@link SpatialHash} instance.
   *
   * @param width - World width.
   * @param height - World height.
   * @param bucketSize - Smallest bucket extent on either axis; the interaction radius.
   * @returns A validated SpatialHash instance.
   * @throws {RangeError} If any argument is not positive, or the world is narrower than three buckets on either axis.
   */
  public static create(width: number, height: number, bucketSize: number): SpatialHash {
    if (width <= 0) {
      throw new RangeError("width must be a positive number");
    }
    if (height <= 0) {
      throw new RangeError("height must be a positive number");
    }
    if (bucketSize <= 0) {
      throw new RangeError("bucketSize must be a positive number");
    }

    const columns = Math.floor(width / bucketSize);
    const rows = Math.floor(height / bucketSize);
    if (columns < MINIMUM_BUCKETS_PER_AXIS || rows < MINIMUM_BUCKETS_PER_AXIS) {
      throw new RangeError("the world must be at least three buckets wide and high");
    }

    return new SpatialHash(width, height, columns, rows);
  }

  /**
   * Places every particle in its bucket. Call once per step, before any
   * {@link forEachNearby}, since particles move between steps.
   *
   * @param particles - The particles to index, with positions inside the world.
   */
  public rebuild(particles: ReadonlyArray<Particle>): void {
    const count = particles.length;
    if (this.sortedIndices.length !== count) {
      this.sortedIndices = new Int32Array(count);
      this.particleBucket = new Int32Array(count);
    }

    this.bucketStart.fill(0);
    for (let index = 0; index < count; index += 1) {
      const bucket = this.bucketOf(particles[index]);
      this.particleBucket[index] = bucket;
      this.bucketStart[bucket + 1] += 1;
    }
    for (let bucket = 1; bucket < this.bucketStart.length; bucket += 1) {
      this.bucketStart[bucket] += this.bucketStart[bucket - 1];
    }

    const nextSlot = this.bucketStart.slice(0, this.bucketStart.length - 1);
    for (let index = 0; index < count; index += 1) {
      const bucket = this.particleBucket[index];
      this.sortedIndices[nextSlot[bucket]] = index;
      nextSlot[bucket] += 1;
    }
  }

  /**
   * Visits the index of every other particle in the 3x3 block of buckets
   * around the particle at `index`, wrapping at the world's edges. Each is
   * visited once; the particle itself is not visited.
   *
   * @param index - Index of the particle, as passed to the last {@link rebuild}.
   * @param visit - Called with the index of each nearby particle.
   */
  public forEachNearby(index: number, visit: (neighbourIndex: number) => void): void {
    const bucket = this.particleBucket[index];
    const column = bucket % this.columns;
    const row = (bucket - column) / this.columns;

    for (const rowOffset of NEIGHBOUR_OFFSETS) {
      const neighbourRow = (row + rowOffset + this.rows) % this.rows;
      for (const columnOffset of NEIGHBOUR_OFFSETS) {
        const neighbourColumn = (column + columnOffset + this.columns) % this.columns;
        const neighbourBucket = neighbourRow * this.columns + neighbourColumn;
        const end = this.bucketStart[neighbourBucket + 1];
        for (let slot = this.bucketStart[neighbourBucket]; slot < end; slot += 1) {
          const neighbourIndex = this.sortedIndices[slot];
          if (neighbourIndex !== index) {
            visit(neighbourIndex);
          }
        }
      }
    }
  }

  /**
   * Returns the bucket a particle's position falls in.
   *
   * Clamped, since a position just below the world's edge can round onto it.
   */
  private bucketOf(particle: Particle): number {
    const column = Math.min(this.columns - 1, Math.floor(particle.x / this.bucketWidth));
    const row = Math.min(this.rows - 1, Math.floor(particle.y / this.bucketHeight));

    return row * this.columns + column;
  }
}
