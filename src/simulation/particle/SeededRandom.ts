/** Increment added to the generator state on every draw (mulberry32). */
const STATE_INCREMENT = 0x6d2b79f5;

/** Multiplier mixed into the first scrambling step (mulberry32). */
const FIRST_MIX_MULTIPLIER = 1;

/** Multiplier mixed into the second scrambling step (mulberry32). */
const SECOND_MIX_MULTIPLIER = 61;

/** Shift of the first scrambling step (mulberry32). */
const FIRST_SHIFT = 15;

/** Shift of the second scrambling step (mulberry32). */
const SECOND_SHIFT = 7;

/** Shift of the final scrambling step (mulberry32). */
const FINAL_SHIFT = 14;

/** Number of distinct 32-bit unsigned values, used to scale a draw into `[0, 1)`. */
const UINT32_RANGE = 4294967296;

/**
 * A small deterministic pseudo-random generator (mulberry32).
 *
 * Two instances created from the same seed produce the same sequence, so
 * anything drawn from one is repeatable.
 *
 * Use the static factory method {@link SeededRandom.create} to construct an instance.
 */
export class SeededRandom {
  private state: number;

  private constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /**
   * Creates a {@link SeededRandom} starting from `seed`.
   *
   * @param seed - The integer the sequence is derived from.
   * @returns A new SeededRandom instance.
   * @throws {RangeError} If seed is not an integer.
   */
  public static create(seed: number): SeededRandom {
    if (!Number.isInteger(seed)) {
      throw new RangeError("seed must be an integer");
    }

    return new SeededRandom(seed);
  }

  /**
   * Draws the next value of the sequence.
   *
   * @returns A number in `[0, 1)`.
   */
  public next(): number {
    this.state = (this.state + STATE_INCREMENT) >>> 0;
    let mixed = this.state;
    mixed = Math.imul(mixed ^ (mixed >>> FIRST_SHIFT), mixed | FIRST_MIX_MULTIPLIER);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> SECOND_SHIFT), mixed | SECOND_MIX_MULTIPLIER);

    return ((mixed ^ (mixed >>> FINAL_SHIFT)) >>> 0) / UINT32_RANGE;
  }
}
