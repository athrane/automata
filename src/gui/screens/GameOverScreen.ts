/**
 * Renders the game-over overlay on top of the simulation canvas.
 *
 * Shows "Game Over" text and a "Continue to title screen" button.
 * Use {@link GameOverScreen.create} to construct an instance.
 */
export class GameOverScreen {
  private readonly container: HTMLElement;
  private readonly onContinueToTitleScreen: () => void;
  private element: HTMLElement | null;

  private constructor(
    container: HTMLElement,
    onContinueToTitleScreen: () => void,
  ) {
    this.container = container;
    this.onContinueToTitleScreen = onContinueToTitleScreen;
    this.element = null;
  }

  /**
   * Creates a {@link GameOverScreen} instance.
   *
   * @param container - DOM element that receives the screen overlay.
   * @param onContinueToTitleScreen - Callback invoked when the "Continue to title screen" button is clicked.
   * @returns A new GameOverScreen instance.
   */
  public static create(
    container: HTMLElement,
    onContinueToTitleScreen: () => void,
  ): GameOverScreen {
    return new GameOverScreen(container, onContinueToTitleScreen);
  }

  /** Builds and appends the game-over overlay to the container. */
  public show(): void {
    const root = document.createElement('div');
    root.style.cssText =
      'position:fixed;inset:0;display:flex;flex-direction:column;' +
      'align-items:center;justify-content:center;' +
      'background:rgba(0,0,0,0.8);color:#fff;font-family:monospace;z-index:10;';

    const heading = document.createElement('h1');
    heading.textContent = 'Game Over';
    heading.style.cssText = 'font-size:3rem;margin:0 0 2rem;';
    root.appendChild(heading);

    const button = document.createElement('button');
    button.textContent = 'Continue to title screen';
    button.style.cssText = 'padding:0.75rem 2rem;font-size:1.2rem;cursor:pointer;';
    button.addEventListener('click', this.onContinueToTitleScreen);
    root.appendChild(button);

    this.element = root;
    this.container.appendChild(root);
  }

  /** Removes the game-over overlay from the container. */
  public hide(): void {
    if (this.element !== null) {
      this.element.remove();
      this.element = null;
    }
  }
}
