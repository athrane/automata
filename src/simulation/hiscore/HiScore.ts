import type { HiScoreEntry } from "./HiScoreEntry";

/** Maximum number of entries retained in the hi-score list. */
const MAX_ENTRIES = 10;

/** The process-wide hi-score list, created on first use. */
let sharedHiScore: HiScore | null = null;

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
   * Returns the process-wide hi-score list, creating it on first use.
   *
   * A {@link HiScore} owned by a single simulation would be discarded together
   * with that simulation, so scores from earlier games would be lost. This
   * shared list outlives any individual simulation and is the default every
   * simulation records into.
   *
   * @returns The single shared HiScore instance.
   */
  public static shared(): HiScore {
    sharedHiScore ??= new HiScore();

    return sharedHiScore;
  }

  /**
   * Discards the shared hi-score list, so the next call to {@link HiScore.shared}
   * creates an empty one. Intended for tests that must not observe entries
   * recorded by other tests.
   */
  public static resetShared(): void {
    sharedHiScore = null;
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
