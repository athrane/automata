import { resolveEffectiveMode, resolveEffectiveStartPositioning } from "../../src/gui/LevelModeSelection";
import { LEVEL_FOUR } from "../../src/simulation/level/LevelFour";
import { LEVEL_ONE } from "../../src/simulation/level/LevelOne";
import { PlayerLocalSimulationMode } from "../../src/simulation/mode/PlayerLocalSimulationMode";
import { FirstClaimedCellPositioning } from "../../src/simulation/player/FirstClaimedCellPositioning";

describe("resolveEffectiveMode", () => {
  it("returns the selected mode for a level without its own mode", () => {
    // Arrange
    const selected = PlayerLocalSimulationMode.create();

    // Act
    const mode = resolveEffectiveMode(LEVEL_ONE, selected);

    // Assert
    expect(mode).toBe(selected);
  });

  it("returns the level's own mode for a level that fixes one", () => {
    // Arrange
    const selected = PlayerLocalSimulationMode.create();

    // Act
    const mode = resolveEffectiveMode(LEVEL_FOUR, selected);

    // Assert
    expect(mode).toBe(LEVEL_FOUR.mode);
  });
});

describe("resolveEffectiveStartPositioning", () => {
  it("returns the selected positioning for a level without its own mode", () => {
    // Arrange
    const selected = FirstClaimedCellPositioning.create();

    // Act
    const positioning = resolveEffectiveStartPositioning(LEVEL_ONE, selected);

    // Assert
    expect(positioning).toBe(selected);
  });

  it("returns null for a level without its own mode when none was selected", () => {
    expect(resolveEffectiveStartPositioning(LEVEL_ONE, null)).toBeNull();
  });

  it("returns null for a level that fixes its mode", () => {
    // Arrange
    const selected = FirstClaimedCellPositioning.create();

    // Act
    const positioning = resolveEffectiveStartPositioning(LEVEL_FOUR, selected);

    // Assert
    expect(positioning).toBeNull();
  });
});
