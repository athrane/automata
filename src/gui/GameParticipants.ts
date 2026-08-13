import type { GameParticipant } from './GameParticipant';

/** The human player, whose rules are chosen on the configuration screen. */
export const HUMAN_PARTICIPANT: GameParticipant = {
  id: 1,
  name: 'Player 1',
  color: 0xff0000,
};

/**
 * Every participant in a game, in scoreboard order: the human player followed
 * by the computer players, which draw their rules at random.
 */
export const GAME_PARTICIPANTS: ReadonlyArray<GameParticipant> = [
  HUMAN_PARTICIPANT,
  { id: 2, name: 'Computer 1', color: 0x0080ff },
  { id: 3, name: 'Computer 2', color: 0x00cc44 },
  { id: 4, name: 'Computer 3', color: 0xffcc00 },
];
