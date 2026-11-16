import type { ParticleLevel } from '../../simulation';
import { resolvePlayerColor } from '../GameParticipants';
import { GuiOptions } from '../GuiOptions';
import { ParticleRenderer } from '../ParticleRenderer';
import { SimulationSpeed } from '../SimulationSpeed';
import { SpeedControlOverlay } from './SpeedControlOverlay';

/** Canvas width in pixels. */
const CANVAS_WIDTH = 800;

/** Canvas height in pixels. */
const CANVAS_HEIGHT = 800;

/**
 * Manages the particle playing screen: builds the level's simulation, starts
 * the particle render loop, shows the speed-control overlay, and tears
 * everything down when the player leaves.
 *
 * There is no scoreboard: particles never change type, so every type's count
 * is constant. The game runs until the player exits.
 *
 * Use {@link ParticlePlayingScreen.create} to construct an instance.
 */
export class ParticlePlayingScreen {
  private readonly container: HTMLElement;
  private readonly onExit: () => void;
  private readonly speedControl: SpeedControlOverlay;
  private renderer: ParticleRenderer | null;
  private speed: SimulationSpeed;

  private constructor(container: HTMLElement, onExit: () => void) {
    this.container = container;
    this.onExit = onExit;
    this.speedControl = SpeedControlOverlay.create(
      container,
      () => { this.handleSlowDown(); },
      () => { this.handleSpeedUp(); },
      () => { this.onExit(); },
    );
    this.renderer = null;
    this.speed = SimulationSpeed.create();
  }

  /**
   * Creates a {@link ParticlePlayingScreen} instance.
   *
   * @param container - DOM element that hosts the simulation canvas and overlay.
   * @param onExit - Callback invoked when the player leaves via the "Exit" button.
   * @returns A new ParticlePlayingScreen instance.
   */
  public static create(container: HTMLElement, onExit: () => void): ParticlePlayingScreen {
    return new ParticlePlayingScreen(container, onExit);
  }

  /**
   * Builds the level's simulation, appends a canvas to the container, shows
   * the speed-control overlay, and starts the render loop.
   *
   * @param level - The particle level to play.
   */
  public show(level: ParticleLevel): void {
    const simulation = level.createSimulation();

    const guiOptions = GuiOptions.create(
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      this.container,
      new Map(level.populations.map((population) => [population.type, resolvePlayerColor(population.type)])),
    );

    this.speed = SimulationSpeed.create();
    this.renderer = ParticleRenderer.create(simulation, guiOptions);
    this.renderer.setFramesPerGeneration(this.speed.getFramesPerGeneration());
    this.renderer.start();

    this.speedControl.show(this.speed);
  }

  /** Stops the render loop and removes the canvas and overlay. */
  public hide(): void {
    this.speedControl.hide();

    if (this.renderer !== null) {
      this.renderer.destroy();
      this.renderer = null;
    }
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
