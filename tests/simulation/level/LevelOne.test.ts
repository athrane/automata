import { LEVEL_ONE } from "../../../src/simulation/level/LevelOne";

describe("LEVEL_ONE", () => {
  it("defines a 100x100 grid", () => {
    expect(LEVEL_ONE.width).toBe(100);
    expect(LEVEL_ONE.height).toBe(100);
  });

  it("assigns the human player id 1", () => {
    expect(LEVEL_ONE.roster.human).toEqual({ id: 1, name: "Player 1" });
  });

  it("defines three computer players with ids 2 to 4", () => {
    expect(LEVEL_ONE.roster.computers.map((player) => player.id)).toEqual([2, 3, 4]);
  });

  it("gives every computer player exactly three rules", () => {
    for (const computer of LEVEL_ONE.roster.computers) {
      expect(computer.rules).toHaveLength(3);
    }
  });

  it("opens on a checker whose first block belongs to the human player", () => {
    expect(LEVEL_ONE.startingPattern.cellAt(0, 0)).toBe(1);
    expect(LEVEL_ONE.startingPattern.cellAt(9, 9)).toBe(1);
  });

  it("cycles the checker through all four players and an empty block", () => {
    expect(LEVEL_ONE.startingPattern.cellAt(10, 0)).toBe(2);
    expect(LEVEL_ONE.startingPattern.cellAt(20, 0)).toBe(3);
    expect(LEVEL_ONE.startingPattern.cellAt(30, 0)).toBe(4);
    expect(LEVEL_ONE.startingPattern.cellAt(40, 0)).toBeNull();
  });

  it("gives every participant an equal share of the opening grid", () => {
    const simulation = LEVEL_ONE.createSimulation(LEVEL_ONE.roster.computers[0].rules);

    const counts = simulation.getCellCounts();

    expect(counts.get(1)).toBe(2000);
    expect(counts.get(2)).toBe(2000);
    expect(counts.get(3)).toBe(2000);
    expect(counts.get(4)).toBe(2000);
  });
});
