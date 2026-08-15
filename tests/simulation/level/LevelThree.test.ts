import { LEVEL_THREE } from "../../../src/simulation/level/LevelThree";

describe("LEVEL_THREE", () => {
  it("defines a 100x100 grid", () => {
    expect(LEVEL_THREE.width).toBe(100);
    expect(LEVEL_THREE.height).toBe(100);
  });

  it("assigns the human player id 1", () => {
    expect(LEVEL_THREE.roster.human).toEqual({ id: 1, name: "Player 1" });
  });

  it("defines three computer players with ids 2 to 4", () => {
    expect(LEVEL_THREE.roster.computers.map((player) => player.id)).toEqual([2, 3, 4]);
  });

  it("gives every computer player exactly three rules", () => {
    for (const computer of LEVEL_THREE.roster.computers) {
      expect(computer.rules).toHaveLength(3);
    }
  });

  it("clusters each participant's rectangle at the centre of the grid", () => {
    expect(LEVEL_THREE.startingPattern.cellAt(49, 49)).toBe(1);
    expect(LEVEL_THREE.startingPattern.cellAt(50, 49)).toBe(2);
    expect(LEVEL_THREE.startingPattern.cellAt(49, 50)).toBe(3);
    expect(LEVEL_THREE.startingPattern.cellAt(50, 50)).toBe(4);
  });

  it("leaves no gap inside the clustered block", () => {
    for (let y = 30; y < 70; y += 1) {
      for (let x = 30; x < 70; x += 1) {
        expect(LEVEL_THREE.startingPattern.cellAt(x, y)).not.toBeNull();
      }
    }
  });

  it("leaves every cell outside the clustered block empty", () => {
    expect(LEVEL_THREE.startingPattern.cellAt(0, 0)).toBeNull();
    expect(LEVEL_THREE.startingPattern.cellAt(29, 30)).toBeNull();
    expect(LEVEL_THREE.startingPattern.cellAt(70, 30)).toBeNull();
  });

  it("gives every participant an equal share of the opening grid", () => {
    const simulation = LEVEL_THREE.createSimulation(LEVEL_THREE.roster.computers[0].rules);

    const counts = simulation.getCellCounts();

    expect(counts.get(1)).toBe(400);
    expect(counts.get(2)).toBe(400);
    expect(counts.get(3)).toBe(400);
    expect(counts.get(4)).toBe(400);
  });
});
