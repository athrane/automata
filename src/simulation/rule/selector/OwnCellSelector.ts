import type { CellSelector } from "./CellSelector";

/**
 * Selects the cells held by the player the rule is evaluated for.
 *
 * Use the static factory method {@link OwnCellSelector.create} to construct an instance.
 */
export class OwnCellSelector implements CellSelector {
  private constructor() {
    // Stateless; construction goes through create for consistency with the project's factories.
  }

  /**
   * Creates an {@link OwnCellSelector} instance.
   *
   * @returns A selector matching the evaluating player's own cells.
   */
  public static create(): OwnCellSelector {
    return new OwnCellSelector();
  }

  /**
   * Returns whether the value is the evaluating player's id.
   *
   * @param value - The cell's current value, or null when the cell is empty.
   * @param playerId - The player the rule is being evaluated for.
   * @returns True when the cell holds `playerId`.
   */
  public selects(value: number | null, playerId: number): boolean {
    return value === playerId;
  }
}
