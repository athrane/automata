/**
 * The human participant of a level, without rules.
 *
 * A level fixes *who* the human player is — the id its starting pattern paints
 * on the grid, and the name recorded with a hi-score — but not *how* they play:
 * the rules are chosen by the player before the game starts and supplied to
 * `Level.createPlayers`.
 */
export interface HumanPlayerSlot {
  /** Unique identifier of the human player, as referenced by the starting pattern. */
  readonly id: number;

  /** Display name of the human player, also recorded with every hi-score entry. */
  readonly name: string;
}
