import { wrapCoordinate } from "../WrapCoordinate";
import type { Particle } from "./Particle";
import type { ParticleSimulationOptions } from "./ParticleSimulationOptions";
import { SpatialHash } from "./SpatialHash";
import { wrapDelta } from "./WrapDelta";

/**
 * Moves particles with floating-point positions through a wrap-around world
 * under a type-by-type attraction matrix.
 *
 * Each {@link step} first computes every particle's force from the positions
 * the step starts from, then moves every particle. No particle's force sees
 * another particle's new position, the same rule the grid engine follows by
 * writing a new grid.
 *
 * Use the static factory method {@link ParticleSimulation.create} to construct an instance.
 */
export class ParticleSimulation {
  /** World width. */
  readonly width: number;

  /** World height. */
  readonly height: number;

  /** Distance beyond which two particles do not affect each other. */
  readonly interactionRadius: number;

  private readonly options: ParticleSimulationOptions;
  private readonly particles: Particle[];
  private readonly hash: SpatialHash;
  private readonly interactionRadiusSquared: number;
  /** Force on each particle, reused every step. */
  private readonly forceX: Float64Array;
  private readonly forceY: Float64Array;
  /** Index of the particle whose force {@link accumulateForce} is summing. */
  private actingIndex: number;
  /** Created once, so a step does not allocate a callback per particle. */
  private readonly accumulateForce: (neighbourIndex: number) => void;
  private stepCount: number;

  private constructor(options: ParticleSimulationOptions, particles: Particle[]) {
    this.width = options.width;
    this.height = options.height;
    this.interactionRadius = options.interactionRadius;
    this.options = options;
    this.particles = particles;
    this.hash = SpatialHash.create(options.width, options.height, options.interactionRadius);
    this.interactionRadiusSquared = options.interactionRadius ** 2;
    this.forceX = new Float64Array(particles.length);
    this.forceY = new Float64Array(particles.length);
    this.actingIndex = 0;
    this.accumulateForce = (neighbourIndex) => { this.addNeighbourForce(neighbourIndex); };
    this.stepCount = 0;
  }

  /**
   * Creates a {@link ParticleSimulation} instance.
   *
   * The particles are updated in place by every {@link step}.
   *
   * @param options - World, force and motion configuration.
   * @param particles - The particles to simulate, with positions inside the world.
   * @returns A new ParticleSimulation instance.
   */
  public static create(options: ParticleSimulationOptions, particles: Particle[]): ParticleSimulation {
    return new ParticleSimulation(options, [...particles]);
  }

  /** The number of steps taken so far. */
  public get generation(): number {
    return this.stepCount;
  }

  /**
   * Advances every particle by `timeStep` units of time.
   *
   * Velocity is multiplied by `friction ** timeStep`, so a run of small steps
   * damps as much as one large step covering the same time.
   *
   * @param timeStep - Units of time to advance by. Must be greater than 0.
   * @throws {RangeError} If timeStep is not greater than 0.
   */
  public step(timeStep: number): void {
    if (!(timeStep > 0)) {
      throw new RangeError("timeStep must be greater than 0");
    }

    this.computeForces();
    this.applyForces(timeStep);
    this.stepCount += 1;
  }

  /**
   * Returns the particles in their current state.
   *
   * @returns The live particles; they change on every {@link step}.
   */
  public getParticles(): ReadonlyArray<Particle> {
    return this.particles;
  }

  /**
   * Counts the particles of each type.
   *
   * @returns The number of particles keyed by type.
   */
  public getTypeCounts(): Map<number, number> {
    const counts = new Map<number, number>();
    for (const particle of this.particles) {
      counts.set(particle.type, (counts.get(particle.type) ?? 0) + 1);
    }

    return counts;
  }

  /** Pass one: sums every particle's force from the positions the step starts from. */
  private computeForces(): void {
    this.hash.rebuild(this.particles);
    this.forceX.fill(0);
    this.forceY.fill(0);

    for (let index = 0; index < this.particles.length; index += 1) {
      this.actingIndex = index;
      this.hash.forEachNearby(index, this.accumulateForce);
    }
  }

  /**
   * Adds the force `neighbourIndex` exerts on the acting particle.
   *
   * A neighbour at zero distance is skipped, since it gives no direction.
   */
  private addNeighbourForce(neighbourIndex: number): void {
    const particle = this.particles[this.actingIndex];
    const neighbour = this.particles[neighbourIndex];
    const dx = wrapDelta(neighbour.x - particle.x, this.width);
    const dy = wrapDelta(neighbour.y - particle.y, this.height);
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared === 0 || distanceSquared >= this.interactionRadiusSquared) {
      return;
    }

    const distance = Math.sqrt(distanceSquared);

    const magnitude = this.options.forceLaw.magnitude(
      distance / this.interactionRadius,
      this.options.forceMatrix.attraction(particle.type, neighbour.type),
    );
    this.forceX[this.actingIndex] += (dx / distance) * magnitude;
    this.forceY[this.actingIndex] += (dy / distance) * magnitude;
  }

  /** Pass two: applies friction and the stored forces, then moves and wraps every particle. */
  private applyForces(timeStep: number): void {
    const damping = this.options.friction ** timeStep;
    const impulse = this.options.forceScale * timeStep;

    for (let index = 0; index < this.particles.length; index += 1) {
      const particle = this.particles[index];
      particle.vx = particle.vx * damping + this.forceX[index] * impulse;
      particle.vy = particle.vy * damping + this.forceY[index] * impulse;
      particle.x = wrapCoordinate(particle.x + particle.vx * timeStep, this.width);
      particle.y = wrapCoordinate(particle.y + particle.vy * timeStep, this.height);
    }
  }
}
