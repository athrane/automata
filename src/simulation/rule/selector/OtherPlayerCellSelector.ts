import type { CellSelector } from "./CellSelector";

/**
 * Selects the cells held by any player other than the one the rule is evaluated for.
 *
 * Use the static factory method {@link OtherPlayerCellSelector.create} to construct an instance.
 */
export class OtherPlayerCellSelector implements CellSelector {
  private constructor() {
    // Stateless; construction goes through create for consistency with the project's factories.
  }

  /**
   * Creates an {@link OtherPlayerCellSelector} instance.
   *
   * @returns A selector matching every other player's cells.
   */
  public static create(): OtherPlayerCellSelector {
    return new OtherPlayerCellSelector();
  }

  /**
   * Returns whether the value is a player id other than the evaluating player's.
   *
   * @param value - The cell's current value, or null when the cell is empty.
   * @param playerId - The player the rule is being evaluated for.
   * @returns True when the cell is occupied by a different player.
   */
  public selects(value: number | null, playerId: number): boolean {
    return value !== null && value !== playerId;
  }
}
