import { HiScore } from "../../../src/simulation/hiscore/HiScore";
import { LEVEL_FOUR, LEVEL_FOUR_STARTING_PATTERN } from "../../../src/simulation/level/LevelFour";
import { SumRule } from "../../../src/simulation/rule/SumRule";

describe("LEVEL_FOUR", () => {
  it("defines a 100x100 grid", () => {
    expect(LEVEL_FOUR.width).toBe(100);
    expect(LEVEL_FOUR.height).toBe(100);
  });

  it("assigns the human player id 1", () => {
    expect(LEVEL_FOUR.roster.human).toEqual({ id: 1, name: "Player 1" });
  });

  it("defines the gas, converter, catalyst and product with ids 2 to 5", () => {
    expect(LEVEL_FOUR.roster.computers.map((player) => [player.id, player.name])).toEqual([
      [2, "Gas"],
      [3, "Converter"],
      [4, "Catalyst"],
      [5, "Product"],
    ]);
  });

  it("gives the gas and the catalyst no rules", () => {
    expect(LEVEL_FOUR.roster.computers[0].rules).toHaveLength(0);
    expect(LEVEL_FOUR.roster.computers[2].rules).toHaveLength(0);
  });

  it("fixes its own mode", () => {
    expect(LEVEL_FOUR.mode).not.toBeNull();
  });

  it("places a catalyst at each scripted cell", () => {
    const cells = [
      [30, 30],
      [70, 30],
      [30, 70],
      [70, 70],
      [50, 20],
      [50, 80],
      [25, 50],
      [75, 50],
    ];

    for (const [x, y] of cells) {
      expect(LEVEL_FOUR_STARTING_PATTERN.cellAt(x, y)).toBe(4);
    }
  });

  it("places the human block on the left", () => {
    expect(LEVEL_FOUR_STARTING_PATTERN.cellAt(10, 45)).toBe(1);
    expect(LEVEL_FOUR_STARTING_PATTERN.cellAt(19, 54)).toBe(1);
  });

  it("places the converter block at the centre", () => {
    expect(LEVEL_FOUR_STARTING_PATTERN.cellAt(47, 47)).toBe(3);
    expect(LEVEL_FOUR_STARTING_PATTERN.cellAt(52, 52)).toBe(3);
  });

  it("fills every other cell with gas", () => {
    expect(LEVEL_FOUR_STARTING_PATTERN.cellAt(0, 0)).toBe(2);
    expect(LEVEL_FOUR_STARTING_PATTERN.cellAt(99, 99)).toBe(2);
    expect(LEVEL_FOUR_STARTING_PATTERN.cellAt(53, 53)).toBe(2);
    expect(LEVEL_FOUR_STARTING_PATTERN.cellAt(31, 30)).toBe(2);
  });

  it("starts the product with no cells", () => {
    const simulation = LEVEL_FOUR.createSimulation([new SumRule([3])], HiScore.create());

    expect(simulation.getCellCounts().get(5)).toBe(0);
  });
});
