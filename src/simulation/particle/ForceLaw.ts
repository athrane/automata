/**
 * Turns the distance between two particles and the attraction between their
 * types into the magnitude of the force one exerts on the other.
 *
 * Works in distance ratios, so an implementation does not need to know the
 * interaction radius.
 */
export interface ForceLaw {
  /**
   * Returns the force magnitude between two particles.
   *
   * @param distanceRatio - Distance between the particles divided by the interaction radius.
   * @param attraction - Attraction between the two types, in `[-1, 1]`.
   * @returns Positive to pull the particles together, negative to push them apart.
   */
  magnitude(distanceRatio: number, attraction: number): number;
}
