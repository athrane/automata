import type { ClaimStrategy } from "../claim/ClaimStrategy";
import { LEVEL_ONE } from "./LevelOne";
import { Level } from "./Level";
import type { StartingPattern } from "./StartingPattern";

/**
 * Id given to every level built by {@link createCustomLevel}.
 *
 * Distinct from the ids 1–3 used by the fixed levels, so a custom level's id
 * can never collide with one of them.
 */
const CUSTOM_LEVEL_ID = 0;

/**
 * Builds a level from a player-chosen starting pattern and claim strategy.
 *
 * The grid dimensions and roster are fixed to {@link LEVEL_ONE}'s, so only the
 * two supplied building blocks vary between one custom level and another.
 *
 * @param startingPattern - The state of the grid at generation 0.
 * @param claimStrategy - Decides which player claims a cell matched by more than one of them.
 * @returns A level combining Level 1's dimensions and roster with the supplied pattern and strategy.
 */
export function createCustomLevel(
  startingPattern: StartingPattern,
  claimStrategy: ClaimStrategy,
): Level {
  return Level.create(
    CUSTOM_LEVEL_ID,
    "Custom Level",
    LEVEL_ONE.width,
    LEVEL_ONE.height,
    LEVEL_ONE.roster,
    startingPattern,
    claimStrategy,
  );
}
