import type { Player } from '../simulation/player/Player';

/** A player taking part in a game, paired with how it is presented on screen. */
export interface GameParticipant {
  /** The simulation player, carrying its id, name, and rules. */
  readonly player: Player;

  /** Three.js hex colour integer used for this participant's cells (e.g. 0xff0000 for red). */
  readonly color: number;
}
