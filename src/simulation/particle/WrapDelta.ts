import { wrapCoordinate } from "../WrapCoordinate";

/**
 * Returns the shortest signed difference between two positions on a
 * wrap-around axis, so two particles on opposite edges are treated as close.
 *
 * The counterpart of {@link wrapCoordinate} for a difference rather than a position.
 *
 * @param delta - The raw difference, `to - from`.
 * @param size - The world extent along this axis. Must be greater than 0.
 * @returns The equivalent difference in `[-size / 2, size / 2]`.
 * @throws {RangeError} If size is not greater than 0.
 */
export function wrapDelta(delta: number, size: number): number {
  const wrapped = wrapCoordinate(delta, size);

  return wrapped > size / 2 ? wrapped - size : wrapped;
}
