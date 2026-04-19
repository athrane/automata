import type { Cell, Grid } from "../types";
import type { Player } from "../player/Player";
import type { SimulationOptions } from "./SimulationOptions";

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
   * @param options - Optional configuration for grid dimensions and players.
   * @throws {RangeError} If width or height is not a positive number.
   */
  constructor(options: SimulationOptions = {}) {
    if (options.width !== undefined && options.width <= 0) {
      throw new RangeError("width must be a positive number");
    }
    if (options.height !== undefined && options.height <= 0) {
      throw new RangeError("height must be a positive number");
    }
    this.width = options.width ?? 100;
    this.height = options.height ?? 100;
    this.players = options.players ?? [];
    this.generation = 0;
    this.grid = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => null as Cell),
    );
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
   * Each cell is assigned to the first player whose rules all match.
   */
  run(): Grid {
    const nextGrid: Grid = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => null as Cell),
    );

    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        for (const player of this.players) {
          const isMatch = player.rules.every((rule) =>
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
}
