import { ConversionRule } from '../simulation/rule/ConversionRule';
import { EmptyCellSelector } from '../simulation/rule/selector/EmptyCellSelector';
import { OtherPlayerCellSelector } from '../simulation/rule/selector/OtherPlayerCellSelector';
import { OwnCellSelector } from '../simulation/rule/selector/OwnCellSelector';
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
  {
    name: 'Overrun at 3+',
    description: "Another player's cell becomes mine when 3 or more of its neighbours are mine.",
    rule: ConversionRule.create(OtherPlayerCellSelector.create(), OwnCellSelector.create(), [3, 4, 5, 6, 7, 8]),
  },
  {
    name: 'Infiltrate at 1–2',
    description: "Another player's cell becomes mine when 1 or 2 of its neighbours are mine.",
    rule: ConversionRule.create(OtherPlayerCellSelector.create(), OwnCellSelector.create(), [1, 2]),
  },
  {
    name: 'Settle at 1+',
    description: 'An empty cell becomes mine when 1 or more of its neighbours are mine.',
    rule: ConversionRule.create(EmptyCellSelector.create(), OwnCellSelector.create(), [1, 2, 3, 4, 5, 6, 7, 8]),
  },
];
