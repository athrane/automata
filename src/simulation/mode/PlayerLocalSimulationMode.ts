import type { Cell } from "../Cell";
import type { Grid } from "../Grid";
import type { GridPosition } from "../player/GridPosition";
import type { Player } from "../player/Player";
import type { GenerationContext } from "./GenerationContext";
import type { SimulationMode } from "./SimulationMode";

/**
 * Applies each player's rules only to the cells that player owns plus the cell
 * it occupies.
 *
 * A cell is therefore never a candidate for two players, so a player can never
 * take territory from another one, and can only birth a cell into empty space
 * by standing on it. Territory decays unless a player walks it back.
 *
 * The claim strategy configured for the game is still consulted, but it is
 * only ever offered a single candidate, so its choice cannot differ from
 * awarding the cell to that player.
 *
 * Use the static factory method {@link PlayerLocalSimulationMode.create} to
 * construct an instance.
 */
export class PlayerLocalSimulationMode implements SimulationMode {
  private constructor() {
    // Stateless; construction goes through create for consistency with the project's factories.
  }

  /**
   * Creates a {@link PlayerLocalSimulationMode} instance.
   *
   * @returns A mode that resolves only each player's own cells and position.
   */
  public static create(): PlayerLocalSimulationMode {
    return new PlayerLocalSimulationMode();
  }

  /**
   * Resolves each player's owned cells and occupied cell, leaving every other
   * cell empty.
   *
   * Starting from an all-empty grid loses nothing, because a cell's value *is*
   * its owner: every non-null cell belongs to exactly one player's evaluated
   * set, so the only cells left untouched are the ones that were empty already.
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

    const ownedCells = this.bucketCellsByOwner(context.grid);

    // Two players share a cell only when one has stepped onto the other's
    // position after that cell died. The first player in roster order keeps
    // it, matching the tie-break FirstMatchClaimStrategy applies elsewhere.
    const resolvedCells = new Set<number>();

    for (const player of context.players) {
      const cells = this.evaluatedCells(context, player, ownedCells.get(player.id) ?? []);

      for (const cell of cells) {
        const key = cell.y * width + cell.x;
        if (resolvedCells.has(key)) {
          continue;
        }

        resolvedCells.add(key);
        nextGrid[cell.y][cell.x] = context.cellClaim.resolve(
          context.grid,
          cell.x,
          cell.y,
          [player],
          context.generation,
        );
      }
    }

    return nextGrid;
  }

  /**
   * Groups every occupied cell of the grid under the id of the player owning it.
   *
   * @param grid - The grid of the generation being read.
   * @returns A map from player id to the cells that player owns.
   */
  private bucketCellsByOwner(grid: Grid): Map<number, GridPosition[]> {
    const owned = new Map<number, GridPosition[]>();

    for (let y = 0; y < grid.length; y += 1) {
      const row = grid[y];
      for (let x = 0; x < row.length; x += 1) {
        const owner = row[x];
        if (owner === null) {
          continue;
        }

        const cells = owned.get(owner);
        if (cells === undefined) {
          owned.set(owner, [{ x, y }]);
        } else {
          cells.push({ x, y });
        }
      }
    }

    return owned;
  }

  /**
   * Returns the cells one player's rules are evaluated for: the cells it owns,
   * plus the cell it occupies when that cell is not among them.
   *
   * @param context - The state of the generation being read.
   * @param player - The player whose evaluated set is being built.
   * @param ownedCells - The cells that player owns in the current grid.
   * @returns The cells to resolve for this player, without duplicates.
   */
  private evaluatedCells(
    context: GenerationContext,
    player: Player,
    ownedCells: ReadonlyArray<GridPosition>,
  ): GridPosition[] {
    const position = context.positions.get(player.id);
    if (position === undefined) {
      return [...ownedCells];
    }

    // A position already owned by the player is in the bucket; anything else
    // is an extra cell the player brings into evaluation by standing on it.
    if (context.grid[position.y][position.x] === player.id) {
      return [...ownedCells];
    }

    return [...ownedCells, position];
  }
}
