import {
  ContestedCellVoidStrategy,
  FirstMatchClaimStrategy,
  IncumbentClaimStrategy,
  NeighbourMajorityClaimStrategy,
  RotatingPriorityClaimStrategy,
  StrongestMatchClaimStrategy,
} from '../simulation';

import type { ClaimStrategy } from '../simulation';

/** A named claim strategy that a player can select for a custom level. */
export interface ClaimStrategyOption {
  /** Display name shown in the configuration screen. */
  readonly name: string;
  /** Short description of the game behaviour the strategy produces. */
  readonly description: string;
  /** The underlying claim strategy instance used during simulation. */
  readonly strategy: ClaimStrategy;
}

/**
 * The full catalogue of claim strategies available for selection when the
 * player builds a custom level in the game-configuration screen.
 *
 * Every composing strategy falls back to {@link FirstMatchClaimStrategy}, the
 * same default a fixed level uses when no strategy is specified.
 */
export const AVAILABLE_CLAIM_STRATEGIES: ReadonlyArray<ClaimStrategyOption> = [
  {
    name: 'First match',
    description: "Today's default: the human player wins every contest, since it is always first in the roster.",
    strategy: FirstMatchClaimStrategy.create(),
  },
  {
    name: 'Incumbent defends',
    description: 'The current occupant keeps a cell it still matches; territory becomes defensible.',
    strategy: IncumbentClaimStrategy.create(FirstMatchClaimStrategy.create()),
  },
  {
    name: 'Strongest match',
    description: 'The player whose rules fit the local neighbourhood best wins the cell.',
    strategy: StrongestMatchClaimStrategy.create(FirstMatchClaimStrategy.create()),
  },
  {
    name: 'Neighbour majority',
    description: 'The player with the most owned neighbours wins; growth follows established territory.',
    strategy: NeighbourMajorityClaimStrategy.create(FirstMatchClaimStrategy.create()),
  },
  {
    name: 'Rotating priority',
    description: 'Roster priority rotates by one player each generation, spreading the first-match advantage evenly.',
    strategy: RotatingPriorityClaimStrategy.create(),
  },
  {
    name: 'Contested cells stay empty',
    description: 'A cell more than one player qualifies for is destroyed instead of awarded to either.',
    strategy: ContestedCellVoidStrategy.create(FirstMatchClaimStrategy.create()),
  },
];
