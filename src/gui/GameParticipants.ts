import type { Player } from '../simulation/player/Player';
import type { Rule } from '../simulation/rule/Rule';
import { AVAILABLE_RULE_PRESETS } from './AvailableRulePresets';
import type { GameParticipant } from './GameParticipant';
import { selectRandomPresetIndices } from './RandomRulePresetSelection';
import type { RulePreset } from './RulePreset';

/** Player id of the human player. */
export const HUMAN_PLAYER_ID = 1;

/** Display name of the human player, also recorded with every hi-score entry. */
export const HUMAN_PLAYER_NAME = 'Player 1';

/** Three.js hex colour of the human player's cells. */
const HUMAN_PLAYER_COLOR = 0xff0000;

/** Three.js hex colours of the computer players' cells, in scoreboard order. */
const COMPUTER_PLAYER_COLORS: ReadonlyArray<number> = [0x0080ff, 0x00cc44, 0xffcc00];

/**
 * Three.js hex colour of a player whose id has no entry in {@link PLAYER_COLORS},
 * so a level that adds a participant still renders.
 */
const DEFAULT_PLAYER_COLOR = 0xffffff;

/** Three.js hex colour of each player's cells, keyed by player id. */
const PLAYER_COLORS: ReadonlyMap<number, number> = new Map([
  [HUMAN_PLAYER_ID, HUMAN_PLAYER_COLOR],
  ...COMPUTER_PLAYER_COLORS.map(
    (color, index): [number, number] => [HUMAN_PLAYER_ID + index + 1, color],
  ),
]);

/** Number of rule presets drawn at random for each computer player. */
const RULES_PER_COMPUTER_PLAYER = 3;

/**
 * Builds every participant in a game, in scoreboard order: the human player
 * followed by one computer player per entry in {@link COMPUTER_PLAYER_COLORS}.
 *
 * The human player uses the presets chosen on the configuration screen; each
 * computer player draws its own presets at random.
 *
 * @param selectedPresets - Rule presets chosen by the human player.
 * @returns The participants of a single game.
 */
export function createGameParticipants(selectedPresets: RulePreset[]): GameParticipant[] {
  const human: GameParticipant = {
    player: {
      id: HUMAN_PLAYER_ID,
      name: HUMAN_PLAYER_NAME,
      rules: selectedPresets.map((preset) => preset.rule),
    },
    color: HUMAN_PLAYER_COLOR,
  };

  const computers = COMPUTER_PLAYER_COLORS.map((color, index) => ({
    player: {
      id: HUMAN_PLAYER_ID + index + 1,
      name: `Computer ${String(index + 1)}`,
      rules: selectRandomRules(),
    },
    color,
  }));

  return [human, ...computers];
}

/**
 * Pairs each player of a running simulation with the colour its cells are drawn in.
 *
 * Takes players rather than a level so the caller can pass
 * `simulation.getPlayers()`, keeping the scoreboard and the renderer's colour
 * map derived from the roster the simulation is actually running.
 *
 * @param players - The players taking part, in scoreboard order.
 * @returns The participants of a single game.
 */
export function createLevelParticipants(players: ReadonlyArray<Player>): GameParticipant[] {
  return players.map((player) => ({
    player,
    color: PLAYER_COLORS.get(player.id) ?? DEFAULT_PLAYER_COLOR,
  }));
}

/**
 * Draws the rules of a single computer player at random from the preset catalogue.
 *
 * @returns The rules assigned to one computer player.
 */
function selectRandomRules(): Rule[] {
  const indices = selectRandomPresetIndices(
    AVAILABLE_RULE_PRESETS.length,
    RULES_PER_COMPUTER_PLAYER,
    Math.random,
  );

  return indices.map((index) => AVAILABLE_RULE_PRESETS[index].rule);
}
