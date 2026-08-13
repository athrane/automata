/** A player taking part in a game, as presented in the gameplay screen. */
export interface GameParticipant {
  /** The simulation player id this participant owns cells under. */
  readonly id: number;
  /** Display name shown in the scoreboard. */
  readonly name: string;
  /** Three.js hex colour integer used for this participant's cells (e.g. 0xff0000 for red). */
  readonly color: number;
}
