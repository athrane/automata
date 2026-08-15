import { SumRule } from "../rule/SumRule";
import { Level } from "./Level";
import type { LevelRoster } from "./LevelRoster";
import { RectanglesStartingPattern } from "./RectanglesStartingPattern";

/** Grid width in cells. */
const GRID_WIDTH = 100;

/** Grid height in cells. */
const GRID_HEIGHT = 100;

/** Width and height of one participant's rectangle, in cells. */
const RECTANGLE_SIZE = 20;

/** The participants of level 2: the human slot and three computer players. */
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
 * Level 2's starting pattern: one {@link RECTANGLE_SIZE}x{@link RECTANGLE_SIZE} block per
 * participant, centred in its own grid quadrant.
 *
 * On this 100x100 toroidal grid the four blocks are exactly 30 cells apart in every
 * direction, including across the wrap boundary — the grid wraps at both edges, so the gap
 * on the far side of a block equals the gap on its near side.
 */
export const LEVEL_TWO_STARTING_PATTERN = RectanglesStartingPattern.create([
  { x: 15, y: 15, width: RECTANGLE_SIZE, height: RECTANGLE_SIZE, owner: 1 },
  { x: 65, y: 15, width: RECTANGLE_SIZE, height: RECTANGLE_SIZE, owner: 2 },
  { x: 15, y: 65, width: RECTANGLE_SIZE, height: RECTANGLE_SIZE, owner: 3 },
  { x: 65, y: 65, width: RECTANGLE_SIZE, height: RECTANGLE_SIZE, owner: 4 },
]);

/** Level 2: a 100x100 grid opening on {@link LEVEL_TWO_STARTING_PATTERN}. */
export const LEVEL_TWO = Level.create(
  2,
  "Level 2",
  GRID_WIDTH,
  GRID_HEIGHT,
  ROSTER,
  LEVEL_TWO_STARTING_PATTERN,
);
