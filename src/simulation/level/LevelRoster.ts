import type { Player } from "../player/Player";
import type { HumanPlayerSlot } from "./HumanPlayerSlot";

/**
 * The participants of a level.
 *
 * The two halves are deliberately different types. Computer players are full
 * {@link Player} objects because a level authors their rules; the human is a
 * {@link HumanPlayerSlot} carrying only an identity, because the player picks
 * their own rules on the configuration screen. Naming the asymmetry here keeps
 * it from being an unwritten convention about which roster entry is special.
 */
export interface LevelRoster {
  /** The human participant, without rules. */
  readonly human: HumanPlayerSlot;

  /** The computer participants, each with the rules the level assigns them. */
  readonly computers: ReadonlyArray<Player>;
}
