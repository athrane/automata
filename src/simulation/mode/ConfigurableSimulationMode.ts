import type { Grid } from "../Grid";
import type { RuleSetApplicationStrategy } from "../claim/application/RuleSetApplicationStrategy";
import { CellClaim } from "../claim/CellClaim";
import type { IterationStrategy } from "../iteration/IterationStrategy";
import type { GenerationContext } from "./GenerationContext";
import type { SimulationMode } from "./SimulationMode";

/**
 * Computes a generation from an injected iteration strategy and rule-set-
 * application strategy.
 *
 * This is the single generic engine every `SimulationMode` runs through: a
 * named preset (see {@link GlobalSimulationMode}, {@link PlayerLocalSimulationMode})
 * is just this class constructed from a matched pair of strategies, and a
 * custom mode is any other pair a caller assembles.
 *
 * Use the static factory method {@link ConfigurableSimulationMode.create} to
 * construct an instance.
 */
export class ConfigurableSimulationMode implements SimulationMode {
  /** Decides which cells this mode evaluates. */
  private readonly iterationStrategy: IterationStrategy;

  /** Decides which players are eligible for a visited cell and how their rules combine. */
  private readonly ruleSetApplicationStrategy: RuleSetApplicationStrategy;

  private constructor(
    iterationStrategy: IterationStrategy,
    ruleSetApplicationStrategy: RuleSetApplicationStrategy,
  ) {
    this.iterationStrategy = iterationStrategy;
    this.ruleSetApplicationStrategy = ruleSetApplicationStrategy;
  }

  /**
   * Creates a {@link ConfigurableSimulationMode} instance.
   *
   * @param iterationStrategy - Decides which cells a generation evaluates.
   * @param ruleSetApplicationStrategy - Decides eligibility and candidate strength for a visited cell.
   * @returns A mode that runs the given strategies through the shared generation loop.
   * @throws {TypeError} If either strategy is not supplied.
   */
  public static create(
    iterationStrategy: IterationStrategy,
    ruleSetApplicationStrategy: RuleSetApplicationStrategy,
  ): ConfigurableSimulationMode {
    if (iterationStrategy === null || iterationStrategy === undefined) {
      throw new TypeError("iterationStrategy must be provided");
    }
    if (ruleSetApplicationStrategy === null || ruleSetApplicationStrategy === undefined) {
      throw new TypeError("ruleSetApplicationStrategy must be provided");
    }

    return new ConfigurableSimulationMode(iterationStrategy, ruleSetApplicationStrategy);
  }

  /**
   * Resolves every cell the iteration strategy visits through a `CellClaim`
   * built from this mode's rule-set-application strategy and the context's
   * claim-resolution strategy.
   *
   * `CellClaim` decides only the cell's value. When it returns null — no
   * candidate won the cell — the rule-set-application strategy's
   * `resolveOwner` decides the owner to fall back to, so a mode that
   * persists claims independent of the current match (a dormant cell) is
   * not forced to lose that claim just because this generation's rules
   * evaluate to null.
   *
   * @param context - The state of the generation being read.
   * @returns A new grid holding the owner and value of each cell in the next generation.
   */
  public nextGeneration(context: GenerationContext): Grid {
    const height = context.grid.length;
    const width = context.grid[0]?.length ?? 0;

    const nextGrid: Grid = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => ({ ownerId: null, value: null })),
    );

    const cellClaim = CellClaim.create(this.ruleSetApplicationStrategy, context.claimStrategy);

    for (const { x, y } of this.iterationStrategy.cellsToVisit(context)) {
      const value = cellClaim.resolve(
        context.grid,
        x,
        y,
        context.players,
        context.positions,
        context.generation,
      );
      const ownerId =
        value ??
        this.ruleSetApplicationStrategy.resolveOwner(
          context.grid,
          x,
          y,
          context.players,
          context.positions,
        );

      nextGrid[y][x] = { ownerId, value };
    }

    return nextGrid;
  }
}
