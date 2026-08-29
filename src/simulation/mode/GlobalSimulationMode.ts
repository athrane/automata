import { UnrestrictedRuleSetApplicationStrategy } from "../claim/application/UnrestrictedRuleSetApplicationStrategy";
import { SweepAllCellsIterationStrategy } from "../iteration/SweepAllCellsIterationStrategy";
import { ConfigurableSimulationMode } from "./ConfigurableSimulationMode";
import type { SimulationMode } from "./SimulationMode";

/**
 * Sweeps every cell of the grid every generation, asking every player's rules
 * about every one of them.
 *
 * Player positions are ignored, so a game in this mode is fully determined by
 * the starting pattern and the players' rules.
 *
 * A named preset of {@link ConfigurableSimulationMode}, pairing
 * {@link SweepAllCellsIterationStrategy} with {@link UnrestrictedRuleSetApplicationStrategy}.
 * Use the static factory method {@link GlobalSimulationMode.create} to
 * construct a mode.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- deliberately a static-only preset factory
export class GlobalSimulationMode {
  private constructor() {
    // Static factory only; never instantiated.
  }

  /**
   * Creates a mode that resolves every cell of the grid each generation.
   *
   * @returns A mode that sweeps the whole grid, offering every cell to every player.
   */
  public static create(): SimulationMode {
    return ConfigurableSimulationMode.create(
      SweepAllCellsIterationStrategy.create(),
      UnrestrictedRuleSetApplicationStrategy.create(),
    );
  }
}
