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

/** The participants of level 3: the human slot and three computer players. */
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
 * Level 3's starting pattern: one {@link RECTANGLE_SIZE}x{@link RECTANGLE_SIZE} block per
 * participant, tiled together at the centre of the grid.
 *
 * The four blocks fill one contiguous 40x40 square with no gap between them, so every
 * participant starts adjacent to every other participant instead of isolated in a quadrant.
 */
export const LEVEL_THREE_STARTING_PATTERN = RectanglesStartingPattern.create([
  { x: 30, y: 30, width: RECTANGLE_SIZE, height: RECTANGLE_SIZE, owner: 1 },
  { x: 50, y: 30, width: RECTANGLE_SIZE, height: RECTANGLE_SIZE, owner: 2 },
  { x: 30, y: 50, width: RECTANGLE_SIZE, height: RECTANGLE_SIZE, owner: 3 },
  { x: 50, y: 50, width: RECTANGLE_SIZE, height: RECTANGLE_SIZE, owner: 4 },
]);

/** Level 3: a 100x100 grid opening on {@link LEVEL_THREE_STARTING_PATTERN}. */
export const LEVEL_THREE = Level.create(
  3,
  "Level 3",
  GRID_WIDTH,
  GRID_HEIGHT,
  ROSTER,
  LEVEL_THREE_STARTING_PATTERN,
);
