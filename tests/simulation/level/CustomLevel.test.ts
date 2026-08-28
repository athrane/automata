import { createCustomLevel } from "../../../src/simulation/level/CustomLevel";
import { LEVEL_ONE } from "../../../src/simulation/level/LevelOne";
import { LEVEL_TWO_STARTING_PATTERN } from "../../../src/simulation/level/LevelTwo";
import { ContestedCellVoidStrategy } from "../../../src/simulation/claim/resolution/ContestedCellVoidStrategy";
import { FirstMatchClaimStrategy } from "../../../src/simulation/claim/resolution/FirstMatchClaimStrategy";

describe("createCustomLevel", () => {
  it("reuses Level 1's dimensions and roster", () => {
    const level = createCustomLevel(LEVEL_TWO_STARTING_PATTERN, FirstMatchClaimStrategy.create());

    expect(level.width).toBe(LEVEL_ONE.width);
    expect(level.height).toBe(LEVEL_ONE.height);
    expect(level.roster).toBe(LEVEL_ONE.roster);
  });

  it("applies the supplied starting pattern", () => {
    const level = createCustomLevel(LEVEL_TWO_STARTING_PATTERN, FirstMatchClaimStrategy.create());

    const simulation = level.createSimulation(level.roster.computers[0].rules);

    expect(simulation.getGrid()[15][15]).toEqual({ ownerId: 1, value: 1 });
    expect(simulation.getGrid()[0][0]).toEqual({ ownerId: null, value: null });
  });

  it("applies the supplied claim strategy", () => {
    const strategy = ContestedCellVoidStrategy.create(FirstMatchClaimStrategy.create());
    const level = createCustomLevel(LEVEL_TWO_STARTING_PATTERN, strategy);

    expect(level.claimStrategy).toBe(strategy);
  });
});
