import type { CellSelector } from "./CellSelector";

/**
 * Selects the cells no player currently holds.
 *
 * Use the static factory method {@link EmptyCellSelector.create} to construct an instance.
 */
export class EmptyCellSelector implements CellSelector {
  private constructor() {
    // Stateless; construction goes through create for consistency with the project's factories.
  }

  /**
   * Creates an {@link EmptyCellSelector} instance.
   *
   * @returns A selector matching empty cells.
   */
  public static create(): EmptyCellSelector {
    return new EmptyCellSelector();
  }

  /**
   * Returns whether the cell is empty.
   *
   * @param value - The cell's current value, or null when the cell is empty.
   * @param _playerId - Unused: emptiness does not depend on the evaluating player.
   * @returns True when the value is null.
   */
  public selects(value: number | null, _playerId: number): boolean {
    return value === null;
  }
}
