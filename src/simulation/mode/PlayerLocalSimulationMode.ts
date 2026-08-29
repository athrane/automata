import { OwnershipEligibilityRuleSetApplicationStrategy } from "../claim/application/OwnershipEligibilityRuleSetApplicationStrategy";
import { OwnedCellIterationStrategy } from "../iteration/OwnedCellIterationStrategy";
import { ConfigurableSimulationMode } from "./ConfigurableSimulationMode";
import type { SimulationMode } from "./SimulationMode";

/**
 * Applies each player's rules only to the cells that player claims plus the
 * cell it occupies.
 *
 * A claim is persistent: once a player has claimed a cell it keeps it even
 * through generations where its rules stop matching and the cell's value goes
 * null. A dormant claimed cell is still visited every generation and can
 * revive — return to a live value — without the player having to walk back
 * onto it.
 *
 * A cell is therefore never a candidate for two players except in the rare
 * case where two players' positions coincide on the same unowned cell; that
 * tie is left to the configured claim-resolution strategy to break, exactly
 * as an ordinary contested cell would be.
 *
 * A named preset of {@link ConfigurableSimulationMode}, pairing
 * {@link OwnedCellIterationStrategy} with {@link OwnershipEligibilityRuleSetApplicationStrategy}.
 * Use the static factory method {@link PlayerLocalSimulationMode.create} to
 * construct a mode.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- deliberately a static-only preset factory
export class PlayerLocalSimulationMode {
  private constructor() {
    // Static factory only; never instantiated.
  }

  /**
   * Creates a mode that resolves only each player's own cells and position.
   *
   * @returns A mode that restricts evaluation to owned or occupied cells.
   */
  public static create(): SimulationMode {
    return ConfigurableSimulationMode.create(
      OwnedCellIterationStrategy.create(),
      OwnershipEligibilityRuleSetApplicationStrategy.create(),
    );
  }
}
