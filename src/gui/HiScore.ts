import type { HiScoreEntry } from './HiScoreEntry';

/** Maximum number of entries retained in the hi-score list. */
const MAX_ENTRIES = 10;

/**
 * Maintains an in-memory, sorted hi-score list capped at {@link MAX_ENTRIES}.
 *
 * Use the static factory method {@link HiScore.create} to construct an instance.
 */
export class HiScore {
  private readonly entries: HiScoreEntry[];

  private constructor() {
    this.entries = [];
  }

  /**
   * Creates an empty {@link HiScore} instance.
   *
   * @returns A new HiScore instance with no entries.
   */
  public static create(): HiScore {
    return new HiScore();
  }

  /**
   * Adds a new entry, re-sorts the list descending by score, and trims it to
   * {@link MAX_ENTRIES} if necessary.
   *
   * @param entry - The hi-score entry to add.
   */
  public addEntry(entry: HiScoreEntry): void {
    this.entries.push(entry);
    this.entries.sort((a, b) => b.score - a.score);
    if (this.entries.length > MAX_ENTRIES) {
      this.entries.splice(MAX_ENTRIES);
    }
  }

  /**
   * Returns a snapshot of the current entries in descending score order.
   *
   * @returns A readonly copy of the hi-score entries.
   */
  public getEntries(): ReadonlyArray<HiScoreEntry> {
    return [...this.entries];
  }
}
