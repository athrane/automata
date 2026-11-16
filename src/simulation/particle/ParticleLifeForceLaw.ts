import type { ForceLaw } from "./ForceLaw";

/**
 * Repulsion ratio used when none is given: the fraction of the interaction
 * radius below which every pair repels.
 */
export const DEFAULT_REPULSION_RATIO = 0.3;

/** Force beyond the interaction radius. */
const OUT_OF_RANGE_FORCE = 0;

/**
 * The particle-life force shape.
 *
 * - Below `repulsionRatio` every pair repels, from -1 at contact to 0 at the ratio,
 *   whatever the attraction between their types.
 * - Between `repulsionRatio` and 1 the force is the attraction scaled by a
 *   triangle that is 0 at both ends and peaks at full strength midway.
 * - At 1 and beyond the force is 0.
 *
 * Use the static factory method {@link ParticleLifeForceLaw.create} to construct an instance.
 */
export class ParticleLifeForceLaw implements ForceLaw {
  /** Fraction of the interaction radius below which every pair repels. */
  readonly repulsionRatio: number;

  private constructor(repulsionRatio: number) {
    this.repulsionRatio = repulsionRatio;
  }

  /**
   * Creates a {@link ParticleLifeForceLaw} instance.
   *
   * @param repulsionRatio - Fraction of the interaction radius below which every pair repels.
   * @returns A validated ParticleLifeForceLaw instance.
   * @throws {RangeError} If repulsionRatio is not in `(0, 1)`.
   */
  public static create(repulsionRatio: number): ParticleLifeForceLaw {
    if (!(repulsionRatio > 0 && repulsionRatio < 1)) {
      throw new RangeError("repulsionRatio must be in (0, 1)");
    }

    return new ParticleLifeForceLaw(repulsionRatio);
  }

  /** @inheritdoc */
  public magnitude(distanceRatio: number, attraction: number): number {
    if (distanceRatio < this.repulsionRatio) {
      return distanceRatio / this.repulsionRatio - 1;
    }
    if (distanceRatio >= 1) {
      return OUT_OF_RANGE_FORCE;
    }

    const bandWidth = 1 - this.repulsionRatio;
    const distanceFromPeak = Math.abs(2 * distanceRatio - 1 - this.repulsionRatio);

    return attraction * (1 - distanceFromPeak / bandWidth);
  }
}
