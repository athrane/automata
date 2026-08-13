import { SumRule } from '../simulation/rule/SumRule';

import type { RulePreset } from './RulePreset';

/**
 * The full catalogue of rule presets available for selection in the
 * game-configuration screen.
 */
export const AVAILABLE_RULE_PRESETS: ReadonlyArray<RulePreset> = [
  {
    name: 'Born at 3',
    description: 'A dead cell becomes alive when it has exactly 3 living neighbours.',
    rule: new SumRule([3]),
  },
  {
    name: 'Survive 2–3',
    description: 'A living cell survives when it has 2 or 3 living neighbours (self included).',
    rule: new SumRule([2, 3], true),
  },
  {
    name: 'Born at 1',
    description: 'A dead cell becomes alive when it has exactly 1 living neighbour.',
    rule: new SumRule([1]),
  },
  {
    name: 'Survive 3–4',
    description: 'A living cell survives when it has 3 or 4 living neighbours (self included).',
    rule: new SumRule([3, 4], true),
  },
  {
    name: 'Born at 2–3',
    description: 'A dead cell becomes alive when it has 2 or 3 living neighbours.',
    rule: new SumRule([2, 3]),
  },
  {
    name: 'Survive at 1',
    description: 'A living cell survives when it has exactly 1 living neighbour (self included).',
    rule: new SumRule([1], true),
  },
  {
    name: 'Born at 1–2',
    description: 'A dead cell becomes alive when it has 1 or 2 living neighbours.',
    rule: new SumRule([1, 2]),
  },
  {
    name: 'Survive 4–5',
    description: 'A living cell survives when it has 4 or 5 living neighbours (self included).',
    rule: new SumRule([4, 5], true),
  },
];
