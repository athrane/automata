import type { ForceLaw } from "./ForceLaw";
import type { ForceMatrix } from "./ForceMatrix";
import { DEFAULT_REPULSION_RATIO, ParticleLifeForceLaw } from "./ParticleLifeForceLaw";

/**
 * Fraction of its velocity a particle keeps over one unit of time when no
 * force acts on it.
 */
const DEFAULT_FRICTION = 0.75;

/** Acceleration, in world units per unit of time squared, that a force of magnitude 1 produces. */
const DEFAULT_FORCE_SCALE = 0.05;

/**
 * Fewest interaction radii the world must span on each axis, so that the
 * neighbour lookup's 3x3 block of radius-wide buckets never wraps onto itself.
 */
const MINIMUM_RADII_PER_AXIS = 3;

/** Configuration options for creating a {@link ParticleSimulation} instance. */
export class ParticleSimulationOptions {
  /** World width. */
  readonly width: number;

  /** World height. */
  readonly height: number;

  /** Distance beyond which two particles do not affect each other. */
  readonly interactionRadius: number;

  /** How strongly each type is drawn toward, or pushed away from, each other type. */
  readonly forceMatrix: ForceMatrix;

  /** Turns distance and attraction into a force magnitude. */
  readonly forceLaw: ForceLaw;

  /** Fraction of its velocity a particle keeps over one unit of time, in `(0, 1]`. */
  readonly friction: number;

  /** Acceleration a force of magnitude 1 produces. */
  readonly forceScale: number;

  private constructor(
    width: number,
    height: number,
    interactionRadius: number,
    forceMatrix: ForceMatrix,
    forceLaw: ForceLaw,
    friction: number,
    forceScale: number,
  ) {
    this.width = width;
    this.height = height;
    this.interactionRadius = interactionRadius;
    this.forceMatrix = forceMatrix;
    this.forceLaw = forceLaw;
    this.friction = friction;
    this.forceScale = forceScale;
  }

  /**
   * Creates a {@link ParticleSimulationOptions} instance.
   *
   * @param width - World width.
   * @param height - World height.
   * @param interactionRadius - Distance beyond which two particles do not affect each other.
   * @param forceMatrix - How strongly each type acts on each other type.
   * @param forceLaw - Turns distance and attraction into a force. Defaults to the particle-life shape with a repulsion ratio of 0.3.
   * @param friction - Fraction of velocity kept over one unit of time. Defaults to 0.75.
   * @param forceScale - Acceleration a force of magnitude 1 produces. Defaults to 0.05.
   * @returns A validated ParticleSimulationOptions instance.
   * @throws {RangeError} If width, height, interactionRadius or forceScale is not positive, friction is not in `(0, 1]`, or the world spans fewer than three interaction radii on either axis.
   */
  public static create(
    width: number,
    height: number,
    interactionRadius: number,
    forceMatrix: ForceMatrix,
    forceLaw?: ForceLaw,
    friction?: number,
    forceScale?: number,
  ): ParticleSimulationOptions {
    const resolvedForceLaw = forceLaw ?? ParticleLifeForceLaw.create(DEFAULT_REPULSION_RATIO);
    const resolvedFriction = friction ?? DEFAULT_FRICTION;
    const resolvedForceScale = forceScale ?? DEFAULT_FORCE_SCALE;

    if (width <= 0) {
      throw new RangeError("width must be a positive number");
    }
    if (height <= 0) {
      throw new RangeError("height must be a positive number");
    }
    if (interactionRadius <= 0) {
      throw new RangeError("interactionRadius must be a positive number");
    }
    if (width < interactionRadius * MINIMUM_RADII_PER_AXIS || height < interactionRadius * MINIMUM_RADII_PER_AXIS) {
      throw new RangeError("the world must span at least three interaction radii on each axis");
    }
    if (!(resolvedFriction > 0 && resolvedFriction <= 1)) {
      throw new RangeError("friction must be in (0, 1]");
    }
    if (resolvedForceScale <= 0) {
      throw new RangeError("forceScale must be a positive number");
    }

    return new ParticleSimulationOptions(
      width,
      height,
      interactionRadius,
      forceMatrix,
      resolvedForceLaw,
      resolvedFriction,
      resolvedForceScale,
    );
  }
}
