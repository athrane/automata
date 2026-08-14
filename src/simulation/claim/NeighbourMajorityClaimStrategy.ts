import type { Cell } from "../Cell";
import type { Grid } from "../Grid";
import { wrapCoordinate } from "../WrapCoordinate";
import type { ClaimCandidate } from "./ClaimCandidate";
import type { ClaimContext } from "./ClaimContext";
import type { ClaimStrategy } from "./ClaimStrategy";

/**
 * The 8 neighbour offsets of the Moore neighbourhood, excluding the centre cell.
 */
const NEIGHBOR_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1], [0, -1], [1, -1],
  [-1,  0],          [1,  0],
  [-1,  1], [0,  1], [1,  1],
];

/**
 * Awards a contested cell to the candidate holding most of its neighbours.
 *
 * Ownership follows local territorial support, so growth spreads out from
 * established territory instead of from roster priority. Neighbour counting
 * wraps at every edge, matching the toroidal geometry the rules use.
 * Candidates tied on the maximum are passed to the fallback.
 */
export class NeighbourMajorityClaimStrategy implements ClaimStrategy {
  /** Neighbourhood support is comparative, so every match is needed. */
  public readonly needsAllCandidates = true;

  /** Decides cells whose leading candidates hold equal neighbourhoods. */
  private readonly fallback: ClaimStrategy;

  private constructor(fallback: ClaimStrategy) {
    this.fallback = fallback;
  }

  /**
   * Creates a {@link NeighbourMajorityClaimStrategy} instance.
   *
   * @param fallback - Breaks ties between equally supported candidates.
   * @returns A strategy that favours local majority ownership.
   * @throws {TypeError} If no fallback is supplied.
   */
  public static create(fallback: ClaimStrategy): NeighbourMajorityClaimStrategy {
    if (fallback === null || fallback === undefined) {
      throw new TypeError("fallback must be provided");
    }

    return new NeighbourMajorityClaimStrategy(fallback);
  }

  /**
   * Returns the id of the candidate owning the most neighbouring cells.
   *
   * Only the tied candidates are handed to the fallback, so it cannot pick a
   * candidate this strategy has already eliminated.
   *
   * @param candidates - The players whose rules matched, in roster order.
   * @param context - The cell being resolved and the state surrounding it.
   * @returns The best supported candidate's id, or the fallback's choice among ties.
   */
  public selectWinner(
    candidates: ReadonlyArray<ClaimCandidate>,
    context: ClaimContext,
  ): Cell {
    const counts = candidates.map((candidate) =>
      this.countNeighbours(context, candidate.player.id),
    );
    const highest = counts.reduce((best, count) => Math.max(best, count), 0);
    const tied = candidates.filter((_, index) => counts[index] === highest);

    if (tied.length === 1) {
      return tied[0].player.id;
    }

    return this.fallback.selectWinner(tied, context);
  }

  /**
   * Counts the cells owned by a player in the 8 neighbours of the resolved cell.
   *
   * @param context - The cell being resolved and the grid it sits in.
   * @param playerId - The player whose cells are counted.
   * @returns The number of neighbouring cells the player owns, from 0 to 8.
   */
  private countNeighbours(context: ClaimContext, playerId: number): number {
    const grid: Grid = context.grid;
    const height = grid.length;
    const width = height > 0 ? grid[0].length : 0;

    if (width === 0 || height === 0) {
      return 0;
    }

    let count = 0;

    for (const [xOffset, yOffset] of NEIGHBOR_OFFSETS) {
      const neighbourX = wrapCoordinate(context.x + xOffset, width);
      const neighbourY = wrapCoordinate(context.y + yOffset, height);

      if (grid[neighbourY][neighbourX] === playerId) {
        count += 1;
      }
    }

    return count;
  }
}
