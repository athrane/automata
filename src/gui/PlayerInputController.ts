import type { Simulation } from '../simulation';

/** Movement applied by each handled key, as a change in x and y. */
const MOVEMENT_KEYS: ReadonlyMap<string, readonly [number, number]> = new Map([
  ['a', [-1, 0]],
  ['d', [1, 0]],
  // y decreases upward because row 0 is the top row, as SimulationRenderer assumes.
  ['w', [0, -1]],
  ['x', [0, 1]],
]);

/**
 * Translates keyboard input into player movement for a running game.
 *
 * Owns the only `keydown` listener in the project, kept out of
 * `GamePlayingScreen` so input handling is one responsibility in one class.
 * A move is applied immediately rather than queued to the next generation
 * boundary: since only the cell occupied at tick time is evaluated, pressing
 * keys rapidly between ticks confers no advantage.
 *
 * Use the static factory method {@link PlayerInputController.create} to
 * construct an instance.
 */
export class PlayerInputController {
  private readonly simulation: Simulation;
  private readonly playerId: number;
  private readonly handleKeyDown: (event: KeyboardEvent) => void;
  private isAttached: boolean;

  private constructor(simulation: Simulation, playerId: number) {
    this.simulation = simulation;
    this.playerId = playerId;
    this.isAttached = false;
    this.handleKeyDown = (event: KeyboardEvent): void => { this.onKeyDown(event); };
  }

  /**
   * Creates a {@link PlayerInputController} instance.
   *
   * @param simulation - The running simulation the moves are applied to.
   * @param playerId - The player the keys move.
   * @returns A controller that is not yet listening; call {@link attach}.
   */
  public static create(simulation: Simulation, playerId: number): PlayerInputController {
    return new PlayerInputController(simulation, playerId);
  }

  /**
   * Starts listening for movement keys.
   *
   * Calling this twice registers no second listener, so a screen that is shown
   * again cannot end up moving the player twice per keypress.
   */
  public attach(): void {
    if (this.isAttached) {
      return;
    }

    window.addEventListener('keydown', this.handleKeyDown);
    this.isAttached = true;
  }

  /** Stops listening, leaving no listener behind when the game ends. */
  public detach(): void {
    if (!this.isAttached) {
      return;
    }

    window.removeEventListener('keydown', this.handleKeyDown);
    this.isAttached = false;
  }

  /**
   * Moves the player when the pressed key is a movement key.
   *
   * The default action is suppressed only for a handled key, so unrelated keys
   * still reach the browser.
   *
   * @param event - The keydown event to handle.
   */
  private onKeyDown(event: KeyboardEvent): void {
    const movement = MOVEMENT_KEYS.get(event.key.toLowerCase());
    if (movement === undefined) {
      return;
    }

    event.preventDefault();
    this.simulation.movePlayer(this.playerId, movement[0], movement[1]);
  }
}
