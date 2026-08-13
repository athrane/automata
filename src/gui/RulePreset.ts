import type { Rule } from '../simulation/rule/Rule';

/** A named, pre-configured rule that a player can select in the configuration screen. */
export interface RulePreset {
  /** Display name shown in the configuration screen. */
  readonly name: string;
  /** Short description of what the rule does. */
  readonly description: string;
  /** The underlying rule instance used during simulation. */
  readonly rule: Rule;
}
