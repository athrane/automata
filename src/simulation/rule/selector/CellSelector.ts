/**
 * Names a group of cell values relative to the player a rule is evaluated for.
 *
 * A {@link ConversionRule} uses one selector to decide which cells it may
 * convert and another to decide which neighbours trigger the conversion.
 */
export interface CellSelector {
  /**
   * Returns whether a cell value belongs to the group this selector names.
   *
   * @param value - The cell's current value, or null when the cell is empty.
   * @param playerId - The player the rule is being evaluated for.
   * @returns True when the value is selected.
   */
  selects(value: number | null, playerId: number): boolean;
}
