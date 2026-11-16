import type { Grid } from "../Grid";
import { NeighborhoodUtils } from "../NeighborhoodUtils";
import type { Rule } from "./Rule";
import type { CellSelector } from "./selector/CellSelector";

/** Highest number of Moore neighbours a cell can have. */
const MAX_NEIGHBOUR_COUNT = 8;

/**
 * A rule that converts a cell based on what it currently holds and which
 * cells surround it.
 *
 * Matches when the resolved cell's value is selected by `target` and the
 * number of Moore neighbours selected by `trigger` is one of `counts`. The
 * rule belongs to the player the cell becomes, so "a cell held by B becomes
 * mine when my cells are next to it" is a rule of the acting player whose
 * target names B and whose trigger names the acting player.
 *
 * The grid is toroidal: neighbour coordinates wrap at every edge.
 *
 * Use the static factory method {@link ConversionRule.create} to construct an instance.
 */
export class ConversionRule implements Rule {
  /** Selects the cells this rule may convert. */
  private readonly target: CellSelector;

  /** Selects the neighbours counted towards a conversion. */
  private readonly trigger: CellSelector;

  /** The trigger-neighbour counts that convert a target cell. */
  private readonly counts: Set<number>;

  private constructor(target: CellSelector, trigger: CellSelector, counts: Set<number>) {
    this.target = target;
    this.trigger = trigger;
    this.counts = counts;
  }

  /**
   * Creates a {@link ConversionRule} instance.
   *
   * @param target - Selects the cells this rule may convert.
   * @param trigger - Selects the neighbours counted towards a conversion.
   * @param counts - The trigger-neighbour counts that convert a target cell.
   * @returns A validated ConversionRule instance.
   * @throws {TypeError} If a selector is missing or counts is not an array.
   * @throws {RangeError} If a count is not an integer between 0 and 8.
   */
  public static create(
    target: CellSelector,
    trigger: CellSelector,
    counts: number[],
  ): ConversionRule {
    if (target === null || target === undefined) {
      throw new TypeError("target must be provided");
    }
    if (trigger === null || trigger === undefined) {
      throw new TypeError("trigger must be provided");
    }
    if (!Array.isArray(counts)) {
      throw new TypeError("counts must be an array");
    }
    for (const count of counts) {
      if (!Number.isInteger(count) || count < 0 || count > MAX_NEIGHBOUR_COUNT) {
        throw new RangeError("counts must be integers between 0 and 8");
      }
    }

    return new ConversionRule(target, trigger, new Set(counts));
  }

  /**
   * Returns true when the cell at (x, y) is a target and its trigger-neighbour
   * count is one of the configured counts.
   *
   * The target is checked first, so the neighbour walk is skipped for every
   * cell the rule cannot apply to.
   *
   * @param grid - The grid of the generation being read.
   * @param x - X coordinate of the cell being resolved.
   * @param y - Y coordinate of the cell being resolved.
   * @param playerId - The player the rule is evaluated for.
   * @returns True when the cell converts to `playerId`.
   */
  public matches(grid: Grid, x: number, y: number, playerId: number): boolean {
    const height = grid.length;
    const width = height > 0 ? grid[0].length : 0;

    if (width === 0 || height === 0) {
      return false;
    }

    if (!this.target.selects(grid[y][x].value, playerId)) {
      return false;
    }

    let count = 0;

    NeighborhoodUtils.forEachMooreNeighbor(width, height, x, y, (nx, ny) => {
      if (this.trigger.selects(grid[ny][nx].value, playerId)) {
        count += 1;
      }
    });

    return this.counts.has(count);
  }
}
