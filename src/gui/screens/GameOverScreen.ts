import { createAsciiDivider, formatBracketed } from '../design/AsciiOrnament';
import { DESIGN_CLASS } from '../design/DesignClasses';

/** Text shown at the top of the game-over overlay. */
const GAME_OVER_TITLE = 'Game Over';

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
    root.className = `${DESIGN_CLASS.SCREEN} ${DESIGN_CLASS.SCREEN_VEIL}`;

    const heading = document.createElement('h1');
    heading.textContent = formatBracketed(GAME_OVER_TITLE);
    heading.className = DESIGN_CLASS.TITLE;
    root.appendChild(heading);

    root.appendChild(createAsciiDivider());

    const button = document.createElement('button');
    button.textContent = 'Continue to title screen';
    button.className = DESIGN_CLASS.BUTTON;
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
