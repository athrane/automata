import { Simulation, SimulationOptions } from '../../simulation';
import type { Player } from '../../simulation/player/Player';
import { GuiOptions } from '../GuiOptions';
import type { RulePreset } from '../RulePreset';
import { SimulationRenderer } from '../SimulationRenderer';

/** Player id used for the single human player. */
const PLAYER_ID = 1;

/** Three.js hex colour for player 1 (red). */
const PLAYER_COLOR = 0xff0000;

/** Canvas width in pixels. */
const CANVAS_WIDTH = 800;

/** Canvas height in pixels. */
const CANVAS_HEIGHT = 800;

/** Simulation grid width in cells. */
const GRID_WIDTH = 100;

/** Simulation grid height in cells. */
const GRID_HEIGHT = 100;

/** Fraction of cells populated when seeding the grid at game start. */
const SEED_DENSITY = 0.3;

/**
 * Manages the gameplay screen: builds the simulation, starts the Three.js
 * render loop, and tears it down when the game ends or the player navigates away.
 *
 * Use {@link GamePlayingScreen.create} to construct an instance.
 */
export class GamePlayingScreen {
  private readonly container: HTMLElement;
  private readonly onGameOver: (generation: number) => void;
  private renderer: SimulationRenderer | null;

  private constructor(container: HTMLElement, onGameOver: (generation: number) => void) {
    this.container = container;
    this.onGameOver = onGameOver;
    this.renderer = null;
  }

  /**
   * Creates a {@link GamePlayingScreen} instance.
   *
   * @param container - DOM element that hosts the simulation canvas.
   * @param onGameOver - Callback invoked with the final generation count when all cells die.
   * @returns A new GamePlayingScreen instance.
   */
  public static create(
    container: HTMLElement,
    onGameOver: (generation: number) => void,
  ): GamePlayingScreen {
    return new GamePlayingScreen(container, onGameOver);
  }

  /**
   * Builds a simulation from the selected presets, appends a canvas to the
   * container, and starts the render loop.
   *
   * @param selectedPresets - Rule presets chosen by the player on the configuration screen.
   */
  public show(selectedPresets: RulePreset[]): void {
    const player: Player = {
      id: PLAYER_ID,
      rules: selectedPresets.map((preset) => preset.rule),
    };

    const simulationOptions = SimulationOptions.create(GRID_WIDTH, GRID_HEIGHT, [player]);
    const simulation = Simulation.create(simulationOptions);
    simulation.seedRandom(SEED_DENSITY, PLAYER_ID);

    const guiOptions = GuiOptions.create(
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      this.container,
      new Map([[PLAYER_ID, PLAYER_COLOR]]),
    );

    this.renderer = SimulationRenderer.create(simulation, guiOptions);
    this.renderer.start(this.onGameOver);
  }

  /** Stops the render loop and removes the canvas from the container. */
  public hide(): void {
    if (this.renderer !== null) {
      this.renderer.destroy();
      this.renderer = null;
    }
  }
}
