import { createLevelParticipants, resolvePlayerColor } from "../../src/gui/GameParticipants";
import type { Player } from "../../src/simulation/player/Player";
import { LEVEL_FOUR, LEVEL_ONE } from "../../src/simulation";
import { SumRule } from "../../src/simulation/rule";

describe("createLevelParticipants", () => {
  it("gives each of level 1's players a distinct colour", () => {
    // Arrange
    const players = LEVEL_ONE.createPlayers([new SumRule([3])]);

    // Act
    const participants = createLevelParticipants(players);

    // Assert
    expect(participants.map((participant) => participant.color)).toEqual([
      0xff0000, 0x0080ff, 0x00cc44, 0xffcc00,
    ]);
  });

  it("keeps the players in roster order", () => {
    // Arrange
    const players = LEVEL_ONE.createPlayers([new SumRule([3])]);

    // Act
    const participants = createLevelParticipants(players);

    // Assert
    expect(participants.map((participant) => participant.player.name)).toEqual([
      "Player 1",
      "Computer 1",
      "Computer 2",
      "Computer 3",
    ]);
  });

  it("passes the player objects through untouched", () => {
    // Arrange
    const players = LEVEL_ONE.createPlayers([new SumRule([3])]);

    // Act
    const participants = createLevelParticipants(players);

    // Assert
    expect(participants[0].player).toBe(players[0]);
  });

  it("gives level 4's fifth participant a colour distinct from the other four", () => {
    // Arrange
    const players = LEVEL_FOUR.createPlayers([new SumRule([3])]);

    // Act
    const colors = createLevelParticipants(players).map((participant) => participant.color);

    // Assert
    expect(colors[4]).not.toBe(0xffffff);
    expect(new Set(colors).size).toBe(5);
  });

  it("falls back to a default colour for an id the palette does not cover", () => {
    // Arrange
    const players: Player[] = [{ id: 99, name: "Computer 99", rules: [] }];

    // Act
    const participants = createLevelParticipants(players);

    // Assert
    expect(participants[0].color).toBe(0xffffff);
  });

  it("returns an empty list for an empty roster", () => {
    // Arrange / Act
    const participants = createLevelParticipants([]);

    // Assert
    expect(participants).toHaveLength(0);
  });
});

describe("resolvePlayerColor", () => {
  it("returns the palette colour for a known id", () => {
    expect(resolvePlayerColor(2)).toBe(0x0080ff);
  });

  it("returns the default colour for an id the palette does not cover", () => {
    expect(resolvePlayerColor(99)).toBe(0xffffff);
  });
});
