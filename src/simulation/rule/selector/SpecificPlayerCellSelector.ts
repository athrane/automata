import type { CellSelector } from "./CellSelector";

/**
 * Selects the cells held by one fixed player, whichever player the rule is evaluated for.
 *
 * Lets a level script an interaction between particular colours, such as a
 * catalyst that only one player's cells react to.
 *
 * Use the static factory method {@link SpecificPlayerCellSelector.create} to construct an instance.
 */
export class SpecificPlayerCellSelector implements CellSelector {
  /** The id of the player whose cells are selected. */
  private readonly targetPlayerId: number;

  private constructor(targetPlayerId: number) {
    this.targetPlayerId = targetPlayerId;
  }

  /**
   * Creates a {@link SpecificPlayerCellSelector} instance.
   *
   * @param targetPlayerId - The id of the player whose cells are selected.
   * @returns A selector matching that player's cells.
   * @throws {RangeError} If targetPlayerId is not a positive integer.
   */
  public static create(targetPlayerId: number): SpecificPlayerCellSelector {
    if (!Number.isInteger(targetPlayerId) || targetPlayerId <= 0) {
      throw new RangeError("targetPlayerId must be a positive integer");
    }

    return new SpecificPlayerCellSelector(targetPlayerId);
  }

  /**
   * Returns whether the value is the fixed player's id.
   *
   * @param value - The cell's current value, or null when the cell is empty.
   * @param _playerId - Unused: the selected player is fixed at construction.
   * @returns True when the cell holds the fixed player's id.
   */
  public selects(value: number | null, _playerId: number): boolean {
    return value === this.targetPlayerId;
  }
}
