import type { Grid } from "../Grid";
import type { GridPosition } from "./GridPosition";
import type { StartPositioningStrategy } from "./StartPositioningStrategy";

/**
 * Starts a player on a cell drawn uniformly from the cells it owns.
 *
 * The random generator is injected rather than taken from `Math.random`
 * directly, following the convention `selectRandomPresetIndices` already
 * establishes, so a test can assert an exact cell.
 *
 * Use the static factory method {@link RandomClaimedCellPositioning.create} to
 * construct an instance.
 */
export class RandomClaimedCellPositioning implements StartPositioningStrategy {
  /** Returns a number in the range [0, 1), used to pick among the owned cells. */
  private readonly random: () => number;

  private constructor(random: () => number) {
    this.random = random;
  }

  /**
   * Creates a {@link RandomClaimedCellPositioning} instance.
   *
   * @param random - Generator returning a number in [0, 1). Defaults to `Math.random`.
   * @returns A strategy that positions a player on a random owned cell.
   */
  public static create(random?: () => number): RandomClaimedCellPositioning {
    return new RandomClaimedCellPositioning(random ?? Math.random);
  }

  /**
   * Returns a cell owned by `playerId`, drawn uniformly from all of them.
   *
   * @param grid - The seeded grid at generation 0.
   * @param playerId - The player to position.
   * @returns One of the player's owned cells.
   * @throws {RangeError} If the player owns no cell in the grid.
   */
  public selectPosition(grid: Grid, playerId: number): GridPosition {
    const cells: GridPosition[] = [];

    for (let y = 0; y < grid.length; y += 1) {
      const row = grid[y];
      for (let x = 0; x < row.length; x += 1) {
        if (row[x] === playerId) {
          cells.push({ x, y });
        }
      }
    }

    if (cells.length === 0) {
      throw new RangeError("player has no claimed cells");
    }

    return cells[Math.floor(this.random() * cells.length)];
  }
}
