/** A single hi-score entry recording a player name and score. */
export interface HiScoreEntry {
  /** The player's display name. */
  readonly name: string;
  /** The score value (higher is better). */
  readonly score: number;
}
