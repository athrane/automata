import type { Player } from "../player/Player";

/** A player eligible to claim a cell in the next generation. */
export interface ClaimCandidate {
  /** The player that may claim the cell. */
  readonly player: Player;

  /**
   * Position of the player in the simulation roster.
   *
   * Carried separately from the candidate array so a strategy can reason
   * about roster priority without depending on how many players ahead of
   * this one happened to match.
   */
  readonly rosterIndex: number;

  /**
   * How many of the player's rules matched the cell.
   *
   * A count rather than a boolean: a player whose three rules all fire on a
   * cell matches it more strongly than one whose single rule does, and a
   * strategy cannot recover that distinction after the fact.
   */
  readonly matchedRuleCount: number;
}
