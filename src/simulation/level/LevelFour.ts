import { ConversionSimulationMode } from "../mode/ConversionSimulationMode";
import { ConversionRule } from "../rule/ConversionRule";
import { OwnCellSelector } from "../rule/selector/OwnCellSelector";
import { SpecificPlayerCellSelector } from "../rule/selector/SpecificPlayerCellSelector";
import { Level } from "./Level";
import type { LevelRoster } from "./LevelRoster";
import type { RectangleRegion } from "./RectangleRegion";
import { RectanglesStartingPattern } from "./RectanglesStartingPattern";

/** Grid width in cells. */
const GRID_WIDTH = 100;

/** Grid height in cells. */
const GRID_HEIGHT = 100;

/** Player id of the gas the converter sweeps through. */
const GAS_ID = 2;

/** Player id of the converter spreading through the gas. */
const CONVERTER_ID = 3;

/** Player id of the stationary catalyst. */
const CATALYST_ID = 4;

/** Player id of the product that forms beside a catalyst. */
const PRODUCT_ID = 5;

/** Neighbour counts of two or more, up to the full Moore neighbourhood. */
const TWO_OR_MORE: number[] = [2, 3, 4, 5, 6, 7, 8];

/** Neighbour counts of one or more, up to the full Moore neighbourhood. */
const ONE_OR_MORE: number[] = [1, 2, 3, 4, 5, 6, 7, 8];

/** Width and height of the human player's block, in cells. */
const HUMAN_BLOCK_SIZE = 10;

/** Width and height of the converter's block, in cells. */
const CONVERTER_BLOCK_SIZE = 6;

/** The cells each catalyst occupies, one cell per entry. */
const CATALYST_CELLS: ReadonlyArray<readonly [number, number]> = [
  [30, 30],
  [70, 30],
  [30, 70],
  [70, 70],
  [50, 20],
  [50, 80],
  [25, 50],
  [75, 50],
];

/**
 * The participants of level 4: the human slot, an inert gas, a converter that
 * takes gas, an inert catalyst, and a product that takes converter cells
 * beside a catalyst and then spreads through the converter.
 */
const ROSTER: LevelRoster = {
  human: { id: 1, name: "Player 1" },
  computers: [
    { id: GAS_ID, name: "Gas", rules: [] },
    {
      id: CONVERTER_ID,
      name: "Converter",
      rules: [
        ConversionRule.create(
          SpecificPlayerCellSelector.create(GAS_ID),
          OwnCellSelector.create(),
          TWO_OR_MORE,
        ),
      ],
    },
    { id: CATALYST_ID, name: "Catalyst", rules: [] },
    {
      id: PRODUCT_ID,
      name: "Product",
      rules: [
        ConversionRule.create(
          SpecificPlayerCellSelector.create(CONVERTER_ID),
          SpecificPlayerCellSelector.create(CATALYST_ID),
          ONE_OR_MORE,
        ),
        ConversionRule.create(
          SpecificPlayerCellSelector.create(CONVERTER_ID),
          OwnCellSelector.create(),
          TWO_OR_MORE,
        ),
      ],
    },
  ],
};

/** One single-cell region per catalyst. */
const CATALYST_REGIONS: RectangleRegion[] = CATALYST_CELLS.map(([x, y]) => ({
  x,
  y,
  width: 1,
  height: 1,
  owner: CATALYST_ID,
}));

/**
 * Level 4's starting pattern: a field of gas holding a human block, a
 * converter block at the centre and eight single-cell catalysts.
 *
 * The small regions are listed before the gas rectangle covering the whole
 * grid, since the first region containing a cell decides its owner. The
 * product starts with no cells and appears only beside a catalyst.
 */
export const LEVEL_FOUR_STARTING_PATTERN = RectanglesStartingPattern.create([
  ...CATALYST_REGIONS,
  { x: 10, y: 45, width: HUMAN_BLOCK_SIZE, height: HUMAN_BLOCK_SIZE, owner: 1 },
  { x: 47, y: 47, width: CONVERTER_BLOCK_SIZE, height: CONVERTER_BLOCK_SIZE, owner: CONVERTER_ID },
  { x: 0, y: 0, width: GRID_WIDTH, height: GRID_HEIGHT, owner: GAS_ID },
]);

/**
 * Level 4: a 100x100 grid opening on {@link LEVEL_FOUR_STARTING_PATTERN},
 * always played in the conversion simulation mode.
 */
export const LEVEL_FOUR = Level.create(
  4,
  "Level 4",
  GRID_WIDTH,
  GRID_HEIGHT,
  ROSTER,
  LEVEL_FOUR_STARTING_PATTERN,
  undefined,
  ConversionSimulationMode.create(),
);
