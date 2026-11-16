import type { CellClaimResolutionStrategy } from "../../src/simulation/claim/resolution/CellClaimResolutionStrategy";
import { ContestedCellVoidStrategy } from "../../src/simulation/claim/resolution/ContestedCellVoidStrategy";
import { FirstMatchClaimStrategy } from "../../src/simulation/claim/resolution/FirstMatchClaimStrategy";
import { IncumbentClaimStrategy } from "../../src/simulation/claim/resolution/IncumbentClaimStrategy";
import { NeighbourMajorityClaimStrategy } from "../../src/simulation/claim/resolution/NeighbourMajorityClaimStrategy";
import { RotatingPriorityClaimStrategy } from "../../src/simulation/claim/resolution/RotatingPriorityClaimStrategy";
import { StrongestMatchClaimStrategy } from "../../src/simulation/claim/resolution/StrongestMatchClaimStrategy";
import { HiScore } from "../../src/simulation/hiscore/HiScore";
import { RectanglesStartingPattern } from "../../src/simulation/level/RectanglesStartingPattern";
import { ConversionSimulationMode } from "../../src/simulation/mode/ConversionSimulationMode";
import type { Player } from "../../src/simulation/player/Player";
import { ConversionRule } from "../../src/simulation/rule/ConversionRule";
import { OwnCellSelector, SpecificPlayerCellSelector } from "../../src/simulation/rule/selector";
import { Simulation } from "../../src/simulation/Simulation";
import { SimulationOptions } from "../../src/simulation/SimulationOptions";

/** Player id of the inert gas. */
const GAS = 2;

/** Player id of the converter that takes gas. */
const CONVERTER = 3;

/** Player id of the stationary catalyst. */
const CATALYST = 4;

/** Player id of the product that forms beside a catalyst. */
const PRODUCT = 5;

/** Player id of an inert wall that stops the front wrapping round the grid. */
const WALL = 6;

/** Width of the front-test grid, in cells. */
const FRONT_WIDTH = 10;

/** Height of the front-test grid, in cells. */
const FRONT_HEIGHT = 3;

/** Neighbour counts of two or more. */
const TWO_OR_MORE = [2, 3, 4, 5, 6, 7, 8];

/** Neighbour counts of one or more. */
const ONE_OR_MORE = [1, 2, 3, 4, 5, 6, 7, 8];

/** The converter's rule: a gas cell with two or more converter neighbours becomes converter. */
function createConverter(): Player {
  return {
    id: CONVERTER,
    name: "Converter",
    rules: [ConversionRule.create(SpecificPlayerCellSelector.create(GAS), OwnCellSelector.create(), TWO_OR_MORE)],
  };
}

/** The product's rules: a converter cell beside a catalyst, or beside two products, becomes product. */
function createProduct(): Player {
  return {
    id: PRODUCT,
    name: "Product",
    rules: [
      ConversionRule.create(
        SpecificPlayerCellSelector.create(CONVERTER),
        SpecificPlayerCellSelector.create(CATALYST),
        ONE_OR_MORE,
      ),
      ConversionRule.create(SpecificPlayerCellSelector.create(CONVERTER), OwnCellSelector.create(), TWO_OR_MORE),
    ],
  };
}

/**
 * A 10x3 grid with a converter column at x=0, a wall column at x=9 and gas in between,
 * so the front can only advance to the right.
 */
function createFrontSimulation(claimStrategy: CellClaimResolutionStrategy): Simulation {
  const players: Player[] = [
    { id: GAS, name: "Gas", rules: [] },
    createConverter(),
    { id: WALL, name: "Wall", rules: [] },
  ];
  const simulation = Simulation.create(
    SimulationOptions.create(
      FRONT_WIDTH,
      FRONT_HEIGHT,
      players,
      HiScore.create(),
      claimStrategy,
      ConversionSimulationMode.create(),
    ),
  );
  simulation.applyStartingPattern(
    RectanglesStartingPattern.create([
      { x: 0, y: 0, width: 1, height: FRONT_HEIGHT, owner: CONVERTER },
      { x: FRONT_WIDTH - 1, y: 0, width: 1, height: FRONT_HEIGHT, owner: WALL },
      { x: 0, y: 0, width: FRONT_WIDTH, height: FRONT_HEIGHT, owner: GAS },
    ]),
  );

  return simulation;
}

/** Returns the value of every cell in row 0 of the simulation's grid. */
function readRow(simulation: Simulation): Array<number | null> {
  return simulation.getGrid()[0].map((cell) => cell.value);
}

/** The expected row 0 after `generation` generations of the front test. */
function expectedFrontRow(generation: number): Array<number | null> {
  return Array.from({ length: FRONT_WIDTH }, (_, x) => {
    if (x === FRONT_WIDTH - 1) {
      return WALL;
    }

    return x <= generation ? CONVERTER : GAS;
  });
}

describe("Conversion game", () => {
  describe("converter front", () => {
    it("advances through the gas by one column per generation", () => {
      // Arrange
      const simulation = createFrontSimulation(FirstMatchClaimStrategy.create());

      for (let generation = 1; generation < FRONT_WIDTH - 1; generation += 1) {
        // Act
        simulation.run();

        // Assert
        expect(readRow(simulation)).toEqual(expectedFrontRow(generation));
      }
    });

    it("leaves cells away from the front unchanged", () => {
      // Arrange
      const simulation = createFrontSimulation(FirstMatchClaimStrategy.create());

      // Act
      simulation.run();

      // Assert
      const grid = simulation.getGrid();
      for (let y = 0; y < FRONT_HEIGHT; y += 1) {
        for (let x = 2; x < FRONT_WIDTH - 1; x += 1) {
          expect(grid[y][x]).toEqual({ ownerId: GAS, value: GAS });
        }
        expect(grid[y][FRONT_WIDTH - 1]).toEqual({ ownerId: WALL, value: WALL });
      }
    });

    it("never empties a cell", () => {
      // Arrange
      const simulation = createFrontSimulation(FirstMatchClaimStrategy.create());

      // Act
      for (let generation = 0; generation < FRONT_WIDTH; generation += 1) {
        simulation.run();
      }

      // Assert
      expect(simulation.getGrid().every((row) => row.every((cell) => cell.value !== null))).toBe(true);
    });
  });

  describe("catalyst", () => {
    /** A 7x7 converter field with one catalyst cell at its centre. */
    function createCatalystSimulation(): Simulation {
      const players: Player[] = [
        createConverter(),
        { id: CATALYST, name: "Catalyst", rules: [] },
        createProduct(),
      ];
      const simulation = Simulation.create(
        SimulationOptions.create(
          7,
          7,
          players,
          HiScore.create(),
          FirstMatchClaimStrategy.create(),
          ConversionSimulationMode.create(),
        ),
      );
      simulation.applyStartingPattern(
        RectanglesStartingPattern.create([
          { x: 3, y: 3, width: 1, height: 1, owner: CATALYST },
          { x: 0, y: 0, width: 7, height: 7, owner: CONVERTER },
        ]),
      );

      return simulation;
    }

    it("turns the converter cells beside the catalyst into product", () => {
      // Arrange
      const simulation = createCatalystSimulation();

      // Act
      simulation.run();

      // Assert
      const grid = simulation.getGrid();
      for (let y = 2; y <= 4; y += 1) {
        for (let x = 2; x <= 4; x += 1) {
          const expected = x === 3 && y === 3 ? CATALYST : PRODUCT;
          expect(grid[y][x].value).toBe(expected);
        }
      }
      expect(grid[3][1].value).toBe(CONVERTER);
    });

    it("spreads the product through the converter on later generations", () => {
      // Arrange
      const simulation = createCatalystSimulation();

      // Act
      simulation.run();
      simulation.run();

      // Assert
      const grid = simulation.getGrid();
      expect(grid[3][1].value).toBe(PRODUCT);
      expect(grid[3][3].value).toBe(CATALYST);
    });

    it("never converts the catalyst cell", () => {
      // Arrange
      const simulation = createCatalystSimulation();

      // Act
      for (let generation = 0; generation < 5; generation += 1) {
        simulation.run();
      }

      // Assert
      expect(simulation.getGrid()[3][3]).toEqual({ ownerId: CATALYST, value: CATALYST });
    });
  });

  describe("incumbent fallback under every claim strategy", () => {
    const strategies: ReadonlyArray<[string, CellClaimResolutionStrategy]> = [
      ["first match", FirstMatchClaimStrategy.create()],
      ["incumbent defends", IncumbentClaimStrategy.create(FirstMatchClaimStrategy.create())],
      ["strongest match", StrongestMatchClaimStrategy.create(FirstMatchClaimStrategy.create())],
      ["neighbour majority", NeighbourMajorityClaimStrategy.create(FirstMatchClaimStrategy.create())],
      ["rotating priority", RotatingPriorityClaimStrategy.create()],
      ["contested cells stay empty", ContestedCellVoidStrategy.create(FirstMatchClaimStrategy.create())],
    ];

    it.each(strategies)("keeps unconverted cells and advances the front under %s", (_name, strategy) => {
      // Arrange
      const simulation = createFrontSimulation(strategy);

      // Act
      simulation.run();
      simulation.run();

      // Assert
      expect(readRow(simulation)).toEqual(expectedFrontRow(2));
    });
  });
});
