/**
 * Wraps a grid coordinate into the range `[0, size)`, so that coordinates
 * running past an edge re-enter the grid on the opposite edge.
 *
 * This makes the grid toroidal: the cell at `x = -1` is the cell at
 * `x = size - 1`, and the cell at `x = size` is the cell at `x = 0`.
 *
 * @param value - The coordinate to wrap. May be negative or beyond `size`.
 * @param size - The grid extent along this axis. Must be greater than 0.
 * @returns The equivalent coordinate inside `[0, size)`.
 * @throws {RangeError} If size is not greater than 0.
 */
export function wrapCoordinate(value: number, size: number): number {
  if (size <= 0) throw new RangeError("size must be greater than 0");

  return ((value % size) + size) % size;
}
