import { PersistentValueRuleSetApplicationStrategy } from "../claim/application/PersistentValueRuleSetApplicationStrategy";
import { UnrestrictedRuleSetApplicationStrategy } from "../claim/application/UnrestrictedRuleSetApplicationStrategy";
import { SweepAllCellsIterationStrategy } from "../iteration/SweepAllCellsIterationStrategy";
import { ConfigurableSimulationMode } from "./ConfigurableSimulationMode";
import type { SimulationMode } from "./SimulationMode";

/**
 * Sweeps every cell of the grid every generation, and keeps each cell's value
 * until some player's rules convert it.
 *
 * Territory is held between generations, so a front moving through another
 * player's region converts it cell by cell instead of the grid churning.
 *
 * A named preset of {@link ConfigurableSimulationMode}, pairing
 * {@link SweepAllCellsIterationStrategy} with a
 * {@link PersistentValueRuleSetApplicationStrategy} around
 * {@link UnrestrictedRuleSetApplicationStrategy}. The sweep is required: a
 * cell must be visited to be carried into the next generation. Use the static
 * factory method {@link ConversionSimulationMode.create} to construct a mode.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- deliberately a static-only preset factory
export class ConversionSimulationMode {
  private constructor() {
    // Static factory only; never instantiated.
  }

  /**
   * Creates a mode in which cells keep their value until a rule converts them.
   *
   * @returns A mode that sweeps the whole grid and persists every unmatched cell.
   */
  public static create(): SimulationMode {
    return ConfigurableSimulationMode.create(
      SweepAllCellsIterationStrategy.create(),
      PersistentValueRuleSetApplicationStrategy.create(UnrestrictedRuleSetApplicationStrategy.create()),
    );
  }
}
