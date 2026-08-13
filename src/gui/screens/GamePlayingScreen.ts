import { Simulation, SimulationOptions } from '../../simulation';
import type { Player } from '../../simulation/player/Player';
import { AVAILABLE_RULE_PRESETS } from '../AvailableRulePresets';
import type { GameParticipant } from '../GameParticipant';
import { GAME_PARTICIPANTS, HUMAN_PARTICIPANT } from '../GameParticipants';
import { GuiOptions } from '../GuiOptions';
import { selectRandomPresetIndices } from '../RandomRulePresetSelection';
import type { RulePreset } from '../RulePreset';
import { SimulationRenderer } from '../SimulationRenderer';
import { SimulationSpeed } from '../SimulationSpeed';
import { ScoreBoardOverlay } from './ScoreBoardOverlay';
import { SpeedControlOverlay } from './SpeedControlOverlay';

/** Number of rule presets drawn at random for each computer player. */
const RULES_PER_COMPUTER_PLAYER = 3;

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
  private readonly onGameOver: (generation: number) => void;
  private readonly onExit: () => void;
  private readonly scoreBoard: ScoreBoardOverlay;
  private readonly speedControl: SpeedControlOverlay;
  private renderer: SimulationRenderer | null;
  private speed: SimulationSpeed;
  private scoreTimerId: ReturnType<typeof setInterval> | null;

  private constructor(
    container: HTMLElement,
    onGameOver: (generation: number) => void,
    onExit: () => void,
  ) {
    this.container = container;
    this.onGameOver = onGameOver;
    this.onExit = onExit;
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
   * @param onGameOver - Callback invoked with the final generation count when all cells die.
   * @param onExit - Callback invoked when the player leaves the game via the "Exit" button.
   * @returns A new GamePlayingScreen instance.
   */
  public static create(
    container: HTMLElement,
    onGameOver: (generation: number) => void,
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
    const players = GAME_PARTICIPANTS.map((participant) =>
      this.createPlayer(participant, selectedPresets),
    );

    const simulationOptions = SimulationOptions.create(GRID_WIDTH, GRID_HEIGHT, players);
    const simulation = Simulation.create(simulationOptions);
    for (const player of players) {
      simulation.seedRandom(PLAYER_SEED_DENSITY, player.id);
    }

    const guiOptions = GuiOptions.create(
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      this.container,
      new Map(GAME_PARTICIPANTS.map((participant) => [participant.id, participant.color])),
    );

    this.speed = SimulationSpeed.create();
    this.renderer = SimulationRenderer.create(simulation, guiOptions);
    this.renderer.setFramesPerGeneration(this.speed.getFramesPerGeneration());
    this.renderer.start((generation) => { this.handleGameOver(generation); });

    this.scoreBoard.show(GAME_PARTICIPANTS);
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
  }

  /**
   * Removes the in-game overlays once the game ends, leaving the final grid on
   * screen behind the game-over overlay, then forwards to the game-over callback.
   *
   * @param generation - The generation the game ended on.
   */
  private handleGameOver(generation: number): void {
    this.removeOverlays();
    this.onGameOver(generation);
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

  /**
   * Builds the simulation player for a participant. The human player uses the
   * presets chosen on the configuration screen; every computer player draws its
   * own presets at random.
   *
   * @param participant - The participant to build a player for.
   * @param selectedPresets - Rule presets chosen by the human player.
   * @returns The player passed to the simulation.
   */
  private createPlayer(
    participant: GameParticipant,
    selectedPresets: RulePreset[],
  ): Player {
    if (participant.id === HUMAN_PARTICIPANT.id) {
      return { id: participant.id, rules: selectedPresets.map((preset) => preset.rule) };
    }

    const indices = selectRandomPresetIndices(
      AVAILABLE_RULE_PRESETS.length,
      RULES_PER_COMPUTER_PLAYER,
      Math.random,
    );

    return { id: participant.id, rules: indices.map((index) => AVAILABLE_RULE_PRESETS[index].rule) };
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
