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
