import type { GameState } from './GameState';

/** Maps each state to the states it is permitted to transition into. */
const VALID_TRANSITIONS: Readonly<Record<GameState, ReadonlyArray<GameState>>> = {
  'title-screen': ['game-configuration'],
  'game-configuration': ['game'],
  'game': ['game-over'],
  'game-over': ['title-screen'],
};

/**
 * Finite-state machine that enforces valid game-state transitions.
 *
 * Use the static factory method {@link StateMachine.create} to construct an instance.
 */
export class StateMachine {
  private state: GameState;

  private constructor(initialState: GameState) {
    this.state = initialState;
  }

  /**
   * Creates a {@link StateMachine} starting in the given state.
   *
   * @param initialState - The state to start in. Defaults to `'title-screen'`.
   * @returns A new StateMachine instance.
   */
  public static create(initialState: GameState = 'title-screen'): StateMachine {
    return new StateMachine(initialState);
  }

  /** The currently active game state. */
  public get currentState(): GameState {
    return this.state;
  }

  /**
   * Transitions to `nextState` if the transition is valid.
   *
   * @param nextState - The state to move into.
   * @throws {Error} If the transition from the current state to `nextState` is not allowed.
   */
  public transition(nextState: GameState): void {
    if (!this.canTransitionTo(nextState)) {
      throw new Error(
        `Invalid state transition from '${this.state}' to '${nextState}'`,
      );
    }
    this.state = nextState;
  }

  /**
   * Returns `true` when transitioning from the current state to `nextState` is permitted.
   *
   * @param nextState - The candidate target state.
   */
  public canTransitionTo(nextState: GameState): boolean {
    return (VALID_TRANSITIONS[this.state] as ReadonlyArray<string>).includes(nextState);
  }
}
