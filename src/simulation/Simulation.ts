import type { Cell } from "./Cell";
import type { Grid } from "./Grid";
import type { Player } from "./player/Player";
import { SimulationOptions } from "./SimulationOptions";

/**
 * Manages the simulation grid and advances it through generations
 * by evaluating player rules.
 */
export class Simulation {
    
  /** Grid width in cells. */
  readonly width: number;

  /** Grid height in cells. */
  readonly height: number;

  /** Current generation number. */
  generation: number;

  /** Players participating in the simulation. */
  private readonly players: Player[];

  /** The simulation grid. */
  private grid: Grid;

  /**
   * @param options - Configuration for grid dimensions and players.
   */
  private constructor(options: SimulationOptions) {
    this.width = options.width;
    this.height = options.height;
    this.players = options.players;
    this.generation = 0;
    this.grid = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => null as Cell),
    );
  }

  /**
   * Creates a new {@link Simulation} instance.
   *
   * @param options - Optional configuration for grid dimensions and players.
   * @returns A new Simulation instance.
   */
  public static create(options?: SimulationOptions): Simulation {
    return new Simulation(options ?? SimulationOptions.create());
  }

  /** Returns a shallow copy of the current grid. */
  getGrid(): Grid {
    return this.grid.map((row) => [...row]);
  }

  /** Sets the value of a single cell. Out-of-bounds coordinates are ignored. */
  setCell(x: number, y: number, value: Cell): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return;
    }

    this.grid[y][x] = value;
  }

  /**
   * Advances the simulation by one generation and returns the new grid.
   * Each cell is assigned to the first player with at least one matching rule.
   *
   * A player's rules are combined with OR, not AND: each rule (e.g. a "born"
   * or a "survive" preset) independently grants the cell, since requiring
   * every selected rule to match the same cell simultaneously is almost
   * never satisfiable and causes the grid to die out within a generation or two.
   */
  run(): Grid {
    const nextGrid: Grid = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => null as Cell),
    );

    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        for (const player of this.players) {
          const isMatch = player.rules.some((rule) =>
            rule.matches(this.grid, x, y, player.id),
          );

          if (isMatch) {
            nextGrid[y][x] = player.id;
            break;
          }
        }
      }
    }

    this.grid = nextGrid;
    this.generation += 1;

    return this.getGrid();
  }

  /**
   * Returns `true` when at least one cell in the grid is occupied (non-null).
   */
  public hasLivingCells(): boolean {
    return this.grid.some((row) => row.some((cell) => cell !== null));
  }

  /**
   * Counts the living cells owned by each player.
   *
   * Every registered player is present in the result, so a player with no
   * remaining cells reports `0` rather than being omitted.
   *
   * @returns A map from player id to the number of cells that player owns.
   */
  public getCellCounts(): Map<number, number> {
    const counts = new Map<number, number>();
    for (const player of this.players) {
      counts.set(player.id, 0);
    }

    for (const row of this.grid) {
      for (const cell of row) {
        if (cell === null) {
          continue;
        }

        counts.set(cell, (counts.get(cell) ?? 0) + 1);
      }
    }

    return counts;
  }

  /**
   * Randomly populates the empty cells of the grid with cells owned by `playerId`.
   *
   * Each empty cell is independently set to `playerId` with probability `density`.
   * Cells that are already occupied are left untouched, so seeding several
   * players in sequence does not let a later player overwrite an earlier one.
   *
   * @param density - Fraction of cells to populate, in the range [0, 1].
   * @param playerId - The player id written into each populated cell.
   * @throws {RangeError} If density is not in the range [0, 1].
   */
  public seedRandom(density: number, playerId: number): void {
    if (density < 0 || density > 1) {
      throw new RangeError('density must be between 0 and 1');
    }
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        if (this.grid[y][x] !== null) {
          continue;
        }

        if (Math.random() < density) {
          this.grid[y][x] = playerId;
        }
      }
    }
  }
}
