import type { Cell } from "../Cell";
import type { Grid } from "../Grid";
import type { GenerationContext } from "./GenerationContext";
import type { SimulationMode } from "./SimulationMode";

/**
 * Sweeps every cell of the grid every generation, asking every player's rules
 * about every one of them.
 *
 * Player positions are ignored, so a game in this mode is fully determined by
 * the starting pattern and the players' rules.
 *
 * Use the static factory method {@link GlobalSimulationMode.create} to
 * construct an instance.
 */
export class GlobalSimulationMode implements SimulationMode {
  private constructor() {
    // Stateless; construction goes through create for consistency with the project's factories.
  }

  /**
   * Creates a {@link GlobalSimulationMode} instance.
   *
   * @returns A mode that resolves every cell of the grid each generation.
   */
  public static create(): GlobalSimulationMode {
    return new GlobalSimulationMode();
  }

  /**
   * Resolves every cell of the grid through the claim strategy.
   *
   * @param context - The state of the generation being read.
   * @returns A new grid holding the owner of each cell in the next generation.
   */
  public nextGeneration(context: GenerationContext): Grid {
    const height = context.grid.length;
    const width = context.grid[0]?.length ?? 0;

    const nextGrid: Grid = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => null as Cell),
    );

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        nextGrid[y][x] = context.cellClaim.resolve(
          context.grid,
          x,
          y,
          context.players,
          context.generation,
        );
      }
    }

    return nextGrid;
  }
}
