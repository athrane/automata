import { ForceMatrix } from "./ForceMatrix";
import { ParticleLevel } from "./ParticleLevel";

/** World width. */
const WORLD_WIDTH = 200;

/** World height. */
const WORLD_HEIGHT = 200;

/** Distance beyond which two particles do not affect each other. */
const INTERACTION_RADIUS = 10;

/** Number of particles of each type. */
const PARTICLES_PER_TYPE = 300;

/** The four particle types, one per player id. */
const TYPES: number[] = [1, 2, 3, 4];

/** Seed the start positions are drawn from. */
const SEED = 33;

/**
 * Row = particle moved, column = neighbour. Each type attracts itself, so it
 * clusters; each is drawn to the next type and pushed away by the previous
 * one, so clusters chase each other.
 */
const FORCE_VALUES: number[][] = [
  [0.8, 0.3, -0.4, 0.0],
  [-0.3, 0.8, 0.3, -0.4],
  [0.0, -0.3, 0.8, 0.3],
  [0.3, 0.0, -0.4, 0.8],
];

/** Particle level 1: four chasing types of 300 particles each in a 200x200 world. */
export const PARTICLE_LEVEL_ONE = ParticleLevel.create(
  1,
  "Particle level 1",
  WORLD_WIDTH,
  WORLD_HEIGHT,
  INTERACTION_RADIUS,
  TYPES.map((type) => ({ type, count: PARTICLES_PER_TYPE })),
  ForceMatrix.create(TYPES, FORCE_VALUES),
  SEED,
);
