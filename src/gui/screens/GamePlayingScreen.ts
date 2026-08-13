import { HiScore, Simulation, SimulationOptions } from '../../simulation';
import type { HiScoreEntry } from '../../simulation';
import { createGameParticipants, HUMAN_PLAYER_NAME } from '../GameParticipants';
import { GuiOptions } from '../GuiOptions';
import type { RulePreset } from '../RulePreset';
import { SimulationRenderer } from '../SimulationRenderer';
import { SimulationSpeed } from '../SimulationSpeed';
import { ScoreBoardOverlay } from './ScoreBoardOverlay';
import { SpeedControlOverlay } from './SpeedControlOverlay';

/** Canvas width in pixels. */
const CANVAS_WIDTH = 800;

/** Canvas height in pixels. */
const CANVAS_HEIGHT = 800;

/** Simulation grid width in cells. */
const GRID_WIDTH = 100;

/** Simulation grid height in cells. */
const GRID_HEIGHT = 100;

/**
 * Fraction of the remaining empty cells populated for each participant when
 * seeding the grid at game start. Chosen so the four participants together
 * fill roughly the same share of the grid as a single player used to.
 */
const PLAYER_SEED_DENSITY = 0.075;

/** Interval in milliseconds between scoreboard refreshes. */
const SCORE_REFRESH_INTERVAL_MS = 200;

/**
 * Manages the gameplay screen: builds the simulation and its participants,
 * starts the Three.js render loop, shows the scoreboard and speed-control
 * overlays, and tears everything down when the game ends or the player leaves.
 *
 * Use {@link GamePlayingScreen.create} to construct an instance.
 */
export class GamePlayingScreen {
  private readonly container: HTMLElement;
  private readonly onGameOver: () => void;
  private readonly onExit: () => void;
  private readonly scoreBoard: ScoreBoardOverlay;
  private readonly speedControl: SpeedControlOverlay;
  private simulation: Simulation | null;
  private renderer: SimulationRenderer | null;
  private speed: SimulationSpeed;
  private scoreTimerId: ReturnType<typeof setInterval> | null;

  private constructor(
    container: HTMLElement,
    onGameOver: () => void,
    onExit: () => void,
  ) {
    this.container = container;
    this.onGameOver = onGameOver;
    this.onExit = onExit;
    this.simulation = null;
    this.scoreBoard = ScoreBoardOverlay.create(container);
    this.speedControl = SpeedControlOverlay.create(
      container,
      () => { this.handleSlowDown(); },
      () => { this.handleSpeedUp(); },
      () => { this.onExit(); },
    );
    this.renderer = null;
    this.speed = SimulationSpeed.create();
    this.scoreTimerId = null;
  }

  /**
   * Creates a {@link GamePlayingScreen} instance.
   *
   * @param container - DOM element that hosts the simulation canvas and overlays.
   * @param onGameOver - Callback invoked when all cells die and the score has been recorded.
   * @param onExit - Callback invoked when the player leaves the game via the "Exit" button.
   * @returns A new GamePlayingScreen instance.
   */
  public static create(
    container: HTMLElement,
    onGameOver: () => void,
    onExit: () => void,
  ): GamePlayingScreen {
    return new GamePlayingScreen(container, onGameOver, onExit);
  }

  /**
   * Builds a simulation from the selected presets and three rule-driven computer
   * players, appends a canvas to the container, shows both overlays, and starts
   * the render loop.
   *
   * @param selectedPresets - Rule presets chosen by the player on the configuration screen.
   */
  public show(selectedPresets: RulePreset[]): void {
    const participants = createGameParticipants(selectedPresets);
    const players = participants.map((participant) => participant.player);

    const simulationOptions = SimulationOptions.create(GRID_WIDTH, GRID_HEIGHT, players);
    const simulation = Simulation.create(simulationOptions);
    this.simulation = simulation;
    for (const player of players) {
      simulation.seedRandom(PLAYER_SEED_DENSITY, player.id);
    }

    const guiOptions = GuiOptions.create(
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      this.container,
      new Map(participants.map((participant) => [participant.player.id, participant.color])),
    );

    this.speed = SimulationSpeed.create();
    this.renderer = SimulationRenderer.create(simulation, guiOptions);
    this.renderer.setFramesPerGeneration(this.speed.getFramesPerGeneration());
    this.renderer.start(() => { this.handleGameOver(); });

    this.scoreBoard.show(participants);
    this.speedControl.show(this.speed);
    this.scoreTimerId = setInterval(() => {
      this.scoreBoard.update(simulation.getCellCounts());
    }, SCORE_REFRESH_INTERVAL_MS);
  }

  /** Stops the render loop, the scoreboard refresh, and removes the canvas and overlays. */
  public hide(): void {
    this.removeOverlays();

    if (this.renderer !== null) {
      this.renderer.destroy();
      this.renderer = null;
    }

    this.simulation = null;
  }

  /**
   * Returns the current hi-score list as reported by the simulation.
   *
   * Falls back to the shared list before the first game, when no simulation
   * has been built yet.
   *
   * @returns A readonly snapshot of the hi-score entries.
   */
  public getHiScores(): ReadonlyArray<HiScoreEntry> {
    return this.simulation?.getHiScores() ?? HiScore.shared().getEntries();
  }

  /**
   * Records the human player's score, removes the in-game overlays once the
   * game ends, leaving the final grid on screen behind the game-over overlay,
   * then forwards to the game-over callback.
   */
  private handleGameOver(): void {
    this.simulation?.recordHiScore(HUMAN_PLAYER_NAME);
    this.removeOverlays();
    this.onGameOver();
  }

  /** Stops the scoreboard refresh and removes both in-game overlays. */
  private removeOverlays(): void {
    if (this.scoreTimerId !== null) {
      clearInterval(this.scoreTimerId);
      this.scoreTimerId = null;
    }

    this.speedControl.hide();
    this.scoreBoard.hide();
  }

  /** Steps the simulation one speed level slower and refreshes the control bar. */
  private handleSlowDown(): void {
    this.speed.slowDown();
    this.applySpeed();
  }

  /** Steps the simulation one speed level faster and refreshes the control bar. */
  private handleSpeedUp(): void {
    this.speed.speedUp();
    this.applySpeed();
  }

  /** Pushes the current speed level into the renderer and the control bar. */
  private applySpeed(): void {
    this.renderer?.setFramesPerGeneration(this.speed.getFramesPerGeneration());
    this.speedControl.refresh(this.speed);
  }
}
