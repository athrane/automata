import { createLevelParticipants } from "../../src/gui/GameParticipants";
import type { Player } from "../../src/simulation/player/Player";
import { LEVEL_ONE } from "../../src/simulation";
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
