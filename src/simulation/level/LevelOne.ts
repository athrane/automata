import type { Cell } from "../Cell";
import { SumRule } from "../rule/SumRule";
import { CheckerStartingPattern } from "./CheckerStartingPattern";
import { Level } from "./Level";
import type { LevelRoster } from "./LevelRoster";

/** Grid width in cells. */
const GRID_WIDTH = 100;

/** Grid height in cells. */
const GRID_HEIGHT = 100;

/** Width and height of one checker block, in cells. */
const CHECKER_BLOCK_SIZE = 10;

/**
 * Cell values cycled through by the checker, one per block: the four
 * participants followed by an empty block.
 */
const CHECKER_SEQUENCE: ReadonlyArray<Cell> = [1, 2, 3, 4, null];

/** The participants of level 1: the human slot and three computer players. */
const ROSTER: LevelRoster = {
  human: { id: 1, name: "Player 1" },
  computers: [
    {
      id: 2,
      name: "Computer 1",
      rules: [new SumRule([3]), new SumRule([2, 3], true), new SumRule([3, 4], true)],
    },
    {
      id: 3,
      name: "Computer 2",
      rules: [new SumRule([1]), new SumRule([1], true), new SumRule([2, 3])],
    },
    {
      id: 4,
      name: "Computer 3",
      rules: [new SumRule([1, 2]), new SumRule([4, 5], true), new SumRule([2, 3], true)],
    },
  ],
};

/**
 * Level 1: a 100x100 grid opening on a checker of 10x10-cell blocks that
 * cycles through players 1, 2, 3, 4, and an empty block.
 *
 * The five-entry cycle divides the ten blocks per row exactly. That matters
 * because the grid is toroidal: a cycle length that did not divide ten would
 * put two same-coloured blocks next to each other at the wrap boundary.
 */
export const LEVEL_ONE = Level.create(
  1,
  "Level 1",
  GRID_WIDTH,
  GRID_HEIGHT,
  ROSTER,
  CheckerStartingPattern.create(CHECKER_BLOCK_SIZE, CHECKER_SEQUENCE),
);
