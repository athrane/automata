import type { SimulationSpeed } from '../SimulationSpeed';

/** Shared styling for every button in the control bar. */
const BUTTON_STYLE = 'padding:0.4rem 1rem;font-family:monospace;font-size:1rem;cursor:pointer;';

/**
 * Renders the in-game control bar as an overlay pinned to the bottom centre of
 * the viewport, offering speed control, a speed readout, and an exit button.
 *
 * Use {@link SpeedControlOverlay.create} to construct an instance.
 */
export class SpeedControlOverlay {
  private readonly container: HTMLElement;
  private readonly onSlowDown: () => void;
  private readonly onSpeedUp: () => void;
  private readonly onExit: () => void;
  private element: HTMLElement | null;
  private slowDownButton: HTMLButtonElement | null;
  private speedUpButton: HTMLButtonElement | null;
  private readout: HTMLElement | null;

  private constructor(
    container: HTMLElement,
    onSlowDown: () => void,
    onSpeedUp: () => void,
    onExit: () => void,
  ) {
    this.container = container;
    this.onSlowDown = onSlowDown;
    this.onSpeedUp = onSpeedUp;
    this.onExit = onExit;
    this.element = null;
    this.slowDownButton = null;
    this.speedUpButton = null;
    this.readout = null;
  }

  /**
   * Creates a {@link SpeedControlOverlay} instance.
   *
   * @param container - DOM element that receives the overlay.
   * @param onSlowDown - Callback invoked when the "Slow down" button is clicked.
   * @param onSpeedUp - Callback invoked when the "Speed up" button is clicked.
   * @param onExit - Callback invoked when the "Exit" button is clicked.
   * @returns A new SpeedControlOverlay instance.
   */
  public static create(
    container: HTMLElement,
    onSlowDown: () => void,
    onSpeedUp: () => void,
    onExit: () => void,
  ): SpeedControlOverlay {
    return new SpeedControlOverlay(container, onSlowDown, onSpeedUp, onExit);
  }

  /**
   * Builds and appends the control bar to the container.
   *
   * @param speed - The speed model whose current level is displayed.
   */
  public show(speed: SimulationSpeed): void {
    const root = document.createElement('div');
    root.style.cssText =
      'position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);' +
      'display:flex;align-items:center;gap:1rem;padding:0.5rem 1rem;' +
      'background:rgba(0,0,0,0.6);color:#fff;font-family:monospace;z-index:20;';

    this.slowDownButton = this.createButton('Slow down', this.onSlowDown);
    root.appendChild(this.slowDownButton);

    this.readout = document.createElement('span');
    this.readout.style.cssText = 'min-width:8rem;text-align:center;';
    root.appendChild(this.readout);

    this.speedUpButton = this.createButton('Speed up', this.onSpeedUp);
    root.appendChild(this.speedUpButton);

    root.appendChild(this.createButton('Exit', this.onExit));

    this.element = root;
    this.container.appendChild(root);
    this.refresh(speed);
  }

  /**
   * Updates the readout and disables the speed buttons at the ends of the range.
   *
   * @param speed - The speed model whose current level is displayed.
   */
  public refresh(speed: SimulationSpeed): void {
    if (this.readout !== null) {
      this.readout.textContent = `Speed: ${String(speed.getLevel())}/${String(speed.getLevelCount())}`;
    }
    if (this.slowDownButton !== null) {
      this.slowDownButton.disabled = speed.isAtMinimum();
    }
    if (this.speedUpButton !== null) {
      this.speedUpButton.disabled = speed.isAtMaximum();
    }
  }

  /** Removes the control bar from the container. */
  public hide(): void {
    if (this.element !== null) {
      this.element.remove();
      this.element = null;
    }
    this.slowDownButton = null;
    this.speedUpButton = null;
    this.readout = null;
  }

  /**
   * Builds a styled control-bar button.
   *
   * @param label - Text shown on the button.
   * @param onClick - Callback invoked when the button is clicked.
   * @returns The button element, ready to append.
   */
  private createButton(label: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = label;
    button.style.cssText = BUTTON_STYLE;
    button.addEventListener('click', onClick);

    return button;
  }
}
