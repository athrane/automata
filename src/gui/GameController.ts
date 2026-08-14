import { LEVEL_ONE } from '../simulation';
import { StateMachine } from '../state';
import { GameConfigurationScreen, GameOverScreen, GamePlayingScreen, TitleScreen } from './screens';
import type { RulePreset } from './RulePreset';

/**
 * Orchestrates game-state transitions and coordinates all screens and the
 * simulation renderer.
 *
 * The state flow is:
 * `title-screen` → `game-configuration` → `game` → `game-over` → `title-screen`
 *
 * A running game can also be abandoned via the in-game "Exit" button, which
 * moves directly from `game` back to `title-screen`.
 *
 * Use the static factory method {@link GameController.create} to construct an instance.
 */
export class GameController {
  private readonly container: HTMLElement;
  private readonly stateMachine: StateMachine;
  private readonly titleScreen: TitleScreen;
  private readonly configScreen: GameConfigurationScreen;
  private readonly gamePlayingScreen: GamePlayingScreen;
  private readonly gameOverScreen: GameOverScreen;

  private constructor(container: HTMLElement) {
    this.container = container;
    this.stateMachine = StateMachine.create('title-screen');

    this.gamePlayingScreen = GamePlayingScreen.create(
      container,
      () => { this.handleGameOver(); },
      () => { this.handleExitGame(); },
    );

    this.titleScreen = TitleScreen.create(
      container,
      () => this.gamePlayingScreen.getHiScores(),
      () => { this.handlePlayGame(); },
    );

    this.configScreen = GameConfigurationScreen.create(
      container,
      (selected) => { this.handleStartGame(selected); },
    );

    this.gameOverScreen = GameOverScreen.create(
      container,
      () => { this.handleContinueToTitleScreen(); },
    );
  }

  /**
   * Creates a {@link GameController} and wires up all screens.
   *
   * @param container - DOM element that hosts all screen overlays and the simulation canvas.
   * @returns A new GameController instance ready to call {@link start}.
   */
  public static create(container: HTMLElement): GameController {
    return new GameController(container);
  }

  /**
   * Starts the controller by showing the title screen.
   * Call this once after the DOM is ready.
   */
  public start(): void {
    this.titleScreen.show();
  }

  private handlePlayGame(): void {
    this.stateMachine.transition('game-configuration');
    this.titleScreen.hide();
    this.configScreen.show();
  }

  private handleStartGame(selectedPresets: RulePreset[]): void {
    this.stateMachine.transition('game');
    this.configScreen.hide();
    this.gamePlayingScreen.show(LEVEL_ONE, selectedPresets);
  }

  private handleContinueToTitleScreen(): void {
    this.stateMachine.transition('title-screen');
    this.gameOverScreen.hide();
    this.gamePlayingScreen.hide();
    this.titleScreen.show();
  }

  /**
   * Abandons the running game and returns to the title screen.
   * No hi-score entry is recorded, since an abandoned game is not a completed run.
   */
  private handleExitGame(): void {
    this.stateMachine.transition('title-screen');
    this.gamePlayingScreen.hide();
    this.titleScreen.show();
  }

  private handleGameOver(): void {
    this.stateMachine.transition('game-over');
    this.gameOverScreen.show();
  }
}
