import { LEVEL_TWO } from "../../../src/simulation/level/LevelTwo";

describe("LEVEL_TWO", () => {
  it("defines a 100x100 grid", () => {
    expect(LEVEL_TWO.width).toBe(100);
    expect(LEVEL_TWO.height).toBe(100);
  });

  it("assigns the human player id 1", () => {
    expect(LEVEL_TWO.roster.human).toEqual({ id: 1, name: "Player 1" });
  });

  it("defines three computer players with ids 2 to 4", () => {
    expect(LEVEL_TWO.roster.computers.map((player) => player.id)).toEqual([2, 3, 4]);
  });

  it("gives every computer player exactly three rules", () => {
    for (const computer of LEVEL_TWO.roster.computers) {
      expect(computer.rules).toHaveLength(3);
    }
  });

  it("places each participant's rectangle at the centre of its own quadrant", () => {
    expect(LEVEL_TWO.startingPattern.cellAt(15, 15)).toBe(1);
    expect(LEVEL_TWO.startingPattern.cellAt(34, 34)).toBe(1);
    expect(LEVEL_TWO.startingPattern.cellAt(65, 15)).toBe(2);
    expect(LEVEL_TWO.startingPattern.cellAt(15, 65)).toBe(3);
    expect(LEVEL_TWO.startingPattern.cellAt(65, 65)).toBe(4);
  });

  it("leaves an equal gap between adjacent rectangles", () => {
    expect(LEVEL_TWO.startingPattern.cellAt(35, 15)).toBeNull();
    expect(LEVEL_TWO.startingPattern.cellAt(64, 15)).toBeNull();
    expect(LEVEL_TWO.startingPattern.cellAt(15, 35)).toBeNull();
    expect(LEVEL_TWO.startingPattern.cellAt(15, 64)).toBeNull();
  });

  it("gives every participant an equal share of the opening grid", () => {
    const simulation = LEVEL_TWO.createSimulation(LEVEL_TWO.roster.computers[0].rules);

    const counts = simulation.getCellCounts();

    expect(counts.get(1)).toBe(400);
    expect(counts.get(2)).toBe(400);
    expect(counts.get(3)).toBe(400);
    expect(counts.get(4)).toBe(400);
  });
});
