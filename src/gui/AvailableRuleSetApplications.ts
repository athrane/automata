import { GlobalRuleSetApplicationStrategy, PlayerLocalRuleSetApplicationStrategy } from '../simulation';

import type { RuleSetApplicationStrategy } from '../simulation';

/** A named rule-set-application strategy that a player can select for a custom simulation mode. */
export interface RuleSetApplicationOption {
  /** Display name shown in the configuration screen. */
  readonly name: string;
  /** Short description of who is eligible for a visited cell. */
  readonly description: string;
  /** The underlying rule-set-application strategy instance used during simulation. */
  readonly strategy: RuleSetApplicationStrategy;
}

/**
 * The full catalogue of rule-set-application strategies available for
 * selection when the player builds a custom simulation mode in the
 * game-configuration screen.
 *
 * The first entry matches the default mode's rule-set-application strategy,
 * so a custom selection that changes nothing else evaluates candidates the
 * same way today's game does.
 */
export const AVAILABLE_RULE_SET_APPLICATIONS: ReadonlyArray<RuleSetApplicationOption> = [
  {
    name: 'Every player competes',
    description: "Every player's rules are consulted for a visited cell, matching the default mode.",
    strategy: GlobalRuleSetApplicationStrategy.create(),
  },
  {
    name: 'Only the owner or occupant',
    description: 'Only the cell\'s current owner or the player standing on it is eligible.',
    strategy: PlayerLocalRuleSetApplicationStrategy.create(),
  },
];
