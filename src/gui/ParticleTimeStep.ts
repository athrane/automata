/** Time step of one particle-simulation step at the fastest speed level. */
const BASE_TIME_STEP = 1;

/**
 * Returns the time step a particle simulation advances by on each animation frame.
 *
 * The particle renderer steps once per frame at every speed level; a slower
 * level takes a smaller step rather than holding a step for several frames,
 * so motion stays smooth.
 *
 * @param framesPerGeneration - The speed level's frames per generation, as reported by `SimulationSpeed`.
 * @returns The base time step divided by `framesPerGeneration`.
 * @throws {RangeError} If framesPerGeneration is less than 1.
 */
export function resolveParticleTimeStep(framesPerGeneration: number): number {
  if (!(framesPerGeneration >= 1)) {
    throw new RangeError("framesPerGeneration must be at least 1");
  }

  return BASE_TIME_STEP / framesPerGeneration;
}
