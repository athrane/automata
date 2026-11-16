import type { ForceMatrix } from "./ForceMatrix";
import type { Particle } from "./Particle";
import { ParticleSimulation } from "./ParticleSimulation";
import { ParticleSimulationOptions } from "./ParticleSimulationOptions";
import { SeededRandom } from "./SeededRandom";

/** The number of particles of one type a particle level starts with. */
export interface ParticlePopulation {
  /** The particles' type, a player id. */
  readonly type: number;

  /** How many particles of this type the level starts with. */
  readonly count: number;
}

/**
 * A particle level: everything that defines how a particle game begins.
 *
 * A particle level fixes the world, the interaction radius, how many particles
 * of each type there are, the force matrix, and the seed their start positions
 * are drawn from. Two simulations created from the same level start identically.
 *
 * Use the static factory method {@link ParticleLevel.create} to construct an instance.
 */
export class ParticleLevel {
  /** Unique identifier of this level. */
  readonly id: number;

  /** Display name of this level. */
  readonly name: string;

  /** World width. */
  readonly width: number;

  /** World height. */
  readonly height: number;

  /** Distance beyond which two particles do not affect each other. */
  readonly interactionRadius: number;

  /** How many particles of each type the level starts with, in placement order. */
  readonly populations: ReadonlyArray<ParticlePopulation>;

  /** How strongly each type is drawn toward, or pushed away from, each other type. */
  readonly forceMatrix: ForceMatrix;

  /** Seed the start positions are drawn from. */
  readonly seed: number;

  private readonly options: ParticleSimulationOptions;

  private constructor(
    id: number,
    name: string,
    populations: ReadonlyArray<ParticlePopulation>,
    seed: number,
    options: ParticleSimulationOptions,
  ) {
    this.id = id;
    this.name = name;
    this.width = options.width;
    this.height = options.height;
    this.interactionRadius = options.interactionRadius;
    this.populations = populations;
    this.forceMatrix = options.forceMatrix;
    this.seed = seed;
    this.options = options;
  }

  /**
   * Creates a {@link ParticleLevel} instance.
   *
   * @param id - Unique identifier of the level.
   * @param name - Display name of the level.
   * @param width - World width.
   * @param height - World height.
   * @param interactionRadius - Distance beyond which two particles do not affect each other.
   * @param populations - How many particles of each type the level starts with.
   * @param forceMatrix - How strongly each type acts on each other type.
   * @param seed - Integer seed the start positions are drawn from.
   * @returns A validated ParticleLevel instance.
   * @throws {RangeError} If a dimension or count is not positive, populations is empty, the seed is not an integer, or the world spans fewer than three interaction radii.
   * @throws {Error} If two populations share a type.
   */
  public static create(
    id: number,
    name: string,
    width: number,
    height: number,
    interactionRadius: number,
    populations: ReadonlyArray<ParticlePopulation>,
    forceMatrix: ForceMatrix,
    seed: number,
  ): ParticleLevel {
    const options = ParticleSimulationOptions.create(width, height, interactionRadius, forceMatrix);

    if (populations.length === 0) {
      throw new RangeError("populations must not be empty");
    }
    if (populations.some((population) => !(population.count > 0))) {
      throw new RangeError("every population count must be a positive number");
    }
    if (new Set(populations.map((population) => population.type)).size !== populations.length) {
      throw new Error("population types must be unique");
    }
    SeededRandom.create(seed);

    return new ParticleLevel(id, name, [...populations], seed, options);
  }

  /**
   * Builds a fresh simulation of this level.
   *
   * Particles are placed in population order at uniformly random positions,
   * drawing x then y from a generator seeded with {@link seed}, and start at rest.
   *
   * @returns A new ParticleSimulation at generation 0.
   */
  public createSimulation(): ParticleSimulation {
    const random = SeededRandom.create(this.seed);
    const particles: Particle[] = [];

    for (const population of this.populations) {
      for (let index = 0; index < population.count; index += 1) {
        const x = random.next() * this.width;
        const y = random.next() * this.height;
        particles.push({ x, y, vx: 0, vy: 0, type: population.type });
      }
    }

    return ParticleSimulation.create(this.options, particles);
  }
}
