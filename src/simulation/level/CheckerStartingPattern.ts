import type { Cell } from "../Cell";
import type { StartingPattern } from "./StartingPattern";

/**
 * A starting pattern of square blocks laid out as a checker, where each block
 * is filled with one entry of a repeating sequence.
 *
 * The block at (blockX, blockY) takes `sequence[(blockX + blockY) % length]`.
 * The two block indices are summed before the modulo so the sequence advances
 * along both axes: using `blockX` alone would repeat horizontally only and
 * produce vertical stripes.
 *
 * Use the static factory method {@link CheckerStartingPattern.create} to
 * construct an instance.
 */
export class CheckerStartingPattern implements StartingPattern {
  /** Width and height of one block, in cells. */
  private readonly blockSize: number;

  /** Cell values cycled through, one per block. */
  private readonly sequence: ReadonlyArray<Cell>;

  private constructor(blockSize: number, sequence: ReadonlyArray<Cell>) {
    this.blockSize = blockSize;
    this.sequence = sequence;
  }

  /**
   * Creates a {@link CheckerStartingPattern} instance.
   *
   * @param blockSize - Width and height of one block, in cells.
   * @param sequence - Cell values cycled through, one per block. A `null`
   *                   entry produces a block that starts empty.
   * @returns A validated CheckerStartingPattern instance.
   * @throws {RangeError} If blockSize is not a positive integer, or the sequence is empty.
   */
  public static create(
    blockSize: number,
    sequence: ReadonlyArray<Cell>,
  ): CheckerStartingPattern {
    if (!Number.isInteger(blockSize) || blockSize <= 0) {
      throw new RangeError("blockSize must be a positive integer");
    }
    if (sequence.length === 0) {
      throw new RangeError("sequence must not be empty");
    }

    return new CheckerStartingPattern(blockSize, [...sequence]);
  }

  /**
   * Returns the sequence entry belonging to the block that contains (x, y).
   *
   * @param x - Column index, counted from the left edge.
   * @param y - Row index, counted from the top edge.
   * @returns The id of the player owning the cell, or `null` if it starts empty.
   */
  cellAt(x: number, y: number): Cell {
    const blockX = Math.floor(x / this.blockSize);
    const blockY = Math.floor(y / this.blockSize);

    return this.sequence[(blockX + blockY) % this.sequence.length];
  }
}
