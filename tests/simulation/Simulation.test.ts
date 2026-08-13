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
      SimulationOptions.create(3, 3, [{ id: 1, rules: [new SumRule([2])] }]),
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
        { id: 1, rules: [new SumRule([1]), new SumRule([4])] },
      ]),
    );

    simulation.setCell(0, 0, 1);

    const nextGrid = simulation.run();

    expect(nextGrid[1][1]).toBe(1);
  });

  it("supports multiple players with different rulesets", () => {
    const simulation = Simulation.create(
      SimulationOptions.create(3, 3, [
        { id: 1, rules: [new SumRule([1])] },
        { id: 2, rules: [new SumRule([1])] },
      ]),
    );

    simulation.setCell(0, 0, 1);
    simulation.setCell(0, 1, 2);

    const nextGrid = simulation.run();

    expect(nextGrid[1][1]).toBe(1);
  });
});
