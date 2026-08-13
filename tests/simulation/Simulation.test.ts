import { Simulation, SimulationOptions } from "../../src/simulation";
import { SumRule } from "../../src/simulation/rule";

describe("Simulation", () => {
  it("starts at generation 0 with default 100x100 grid", () => {
    const simulation = Simulation.create();

    const grid = simulation.getGrid();

    expect(simulation.generation).toBe(0);
    expect(simulation.width).toBe(100);
    expect(simulation.height).toBe(100);
    expect(grid).toHaveLength(100);
    expect(grid[0]).toHaveLength(100);
  });

  it("supports custom rectangular grid size", () => {
    const simulation = Simulation.create(SimulationOptions.create(3, 2));

    const grid = simulation.getGrid();

    expect(grid).toHaveLength(2);
    expect(grid[0]).toHaveLength(3);
  });

  it("calculates the next generation when run is called", () => {
    const simulation = Simulation.create(
      SimulationOptions.create(3, 3, [{ id: 1, name: "Player 1", rules: [new SumRule([2])] }]),
    );

    simulation.setCell(0, 0, 1);
    simulation.setCell(0, 1, 1);

    const nextGrid = simulation.run();

    expect(simulation.generation).toBe(1);
    expect(nextGrid[1][1]).toBe(1);
    expect(nextGrid[0][0]).toBeNull();
  });

  it("combines a player's multiple rules with OR, not AND", () => {
    // These two rules can never both match the same cell (a neighbor count
    // cannot be both 1 and 4 at once). An AND combination would therefore
    // never populate any cell, starving the grid within a generation.
    const simulation = Simulation.create(
      SimulationOptions.create(3, 3, [
        { id: 1, name: "Player 1", rules: [new SumRule([1]), new SumRule([4])] },
      ]),
    );

    simulation.setCell(0, 0, 1);

    const nextGrid = simulation.run();

    expect(nextGrid[1][1]).toBe(1);
  });

  it("supports multiple players with different rulesets", () => {
    const simulation = Simulation.create(
      SimulationOptions.create(3, 3, [
        { id: 1, name: "Player 1", rules: [new SumRule([1])] },
        { id: 2, name: "Player 2", rules: [new SumRule([1])] },
      ]),
    );

    simulation.setCell(0, 0, 1);
    simulation.setCell(0, 1, 2);

    const nextGrid = simulation.run();

    expect(nextGrid[1][1]).toBe(1);
  });

  describe("getCellCounts", () => {
    it("reports zero for every registered player on an empty grid", () => {
      const simulation = Simulation.create(
        SimulationOptions.create(3, 3, [
          { id: 1, name: "Player 1", rules: [] },
          { id: 2, name: "Player 2", rules: [] },
        ]),
      );

      const counts = simulation.getCellCounts();

      expect(counts.get(1)).toBe(0);
      expect(counts.get(2)).toBe(0);
    });

    it("counts cells against their owning player", () => {
      const simulation = Simulation.create(
        SimulationOptions.create(3, 3, [
          { id: 1, name: "Player 1", rules: [] },
          { id: 2, name: "Player 2", rules: [] },
        ]),
      );

      simulation.setCell(0, 0, 1);
      simulation.setCell(1, 0, 1);
      simulation.setCell(2, 2, 2);

      const counts = simulation.getCellCounts();

      expect(counts.get(1)).toBe(2);
      expect(counts.get(2)).toBe(1);
    });

    it("keeps a player with no cells in the result", () => {
      const simulation = Simulation.create(
        SimulationOptions.create(3, 3, [
          { id: 1, name: "Player 1", rules: [] },
          { id: 2, name: "Player 2", rules: [] },
        ]),
      );

      simulation.setCell(0, 0, 1);

      const counts = simulation.getCellCounts();

      expect(counts.size).toBe(2);
      expect(counts.get(2)).toBe(0);
    });
  });

  describe("seedRandom", () => {
    it("leaves cells owned by an earlier player untouched", () => {
      const simulation = Simulation.create(
        SimulationOptions.create(3, 3, [
          { id: 1, name: "Player 1", rules: [] },
          { id: 2, name: "Player 2", rules: [] },
        ]),
      );

      simulation.setCell(0, 0, 1);
      simulation.seedRandom(1, 2);

      const grid = simulation.getGrid();

      expect(grid[0][0]).toBe(1);
      expect(grid[0][1]).toBe(2);
    });

    it("rejects a density outside the range [0, 1]", () => {
      const simulation = Simulation.create(SimulationOptions.create(3, 3));

      expect(() => { simulation.seedRandom(1.5, 1); }).toThrow(RangeError);
    });
  });
});
