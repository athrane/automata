/**
 * A particle with a floating-point position and velocity in a wrap-around world.
 *
 * Position and velocity are mutable because the particle engine updates them
 * in place every step, rather than allocating a new particle per step.
 */
export interface Particle {
  /** Horizontal position, in `[0, width)`. */
  x: number;

  /** Vertical position, in `[0, height)`. */
  y: number;

  /** Horizontal velocity, in world units per unit of time. */
  vx: number;

  /** Vertical velocity, in world units per unit of time. */
  vy: number;

  /** The player id this particle belongs to. */
  readonly type: number;
}
