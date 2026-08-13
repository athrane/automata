import type { HiScoreEntry } from '../../simulation';

/** Display title shown at the top of the title screen. */
const GAME_TITLE = 'Automata';

/**
 * Renders the title screen as a full-page DOM overlay.
 *
 * Shows the game title, the current hi-score list, and a "Play game" button.
 * Use {@link TitleScreen.create} to construct an instance.
 */
export class TitleScreen {
  private readonly container: HTMLElement;
  private readonly hiScoreProvider: () => ReadonlyArray<HiScoreEntry>;
  private readonly onPlayGame: () => void;
  private element: HTMLElement | null;

  private constructor(
    container: HTMLElement,
    hiScoreProvider: () => ReadonlyArray<HiScoreEntry>,
    onPlayGame: () => void,
  ) {
    this.container = container;
    this.hiScoreProvider = hiScoreProvider;
    this.onPlayGame = onPlayGame;
    this.element = null;
  }

  /**
   * Creates a {@link TitleScreen} instance.
   *
   * @param container - DOM element that receives the screen overlay.
   * @param hiScoreProvider - Returns the hi-score list to display, read on every {@link show}.
   * @param onPlayGame - Callback invoked when the "Play game" button is clicked.
   * @returns A new TitleScreen instance.
   */
  public static create(
    container: HTMLElement,
    hiScoreProvider: () => ReadonlyArray<HiScoreEntry>,
    onPlayGame: () => void,
  ): TitleScreen {
    return new TitleScreen(container, hiScoreProvider, onPlayGame);
  }

  /** Builds and appends the title-screen overlay to the container. */
  public show(): void {
    const root = document.createElement('div');
    root.style.cssText =
      'position:fixed;inset:0;display:flex;flex-direction:column;' +
      'align-items:center;justify-content:center;background:#111;' +
      'color:#fff;font-family:monospace;z-index:10;';

    const title = document.createElement('h1');
    title.textContent = GAME_TITLE;
    title.style.cssText = 'font-size:3rem;margin:0 0 2rem;';
    root.appendChild(title);

    const hiScoreHeading = document.createElement('h2');
    hiScoreHeading.textContent = 'Hi-Score';
    hiScoreHeading.style.cssText = 'font-size:1.5rem;margin:0 0 0.75rem;';
    root.appendChild(hiScoreHeading);

    const list = document.createElement('ol');
    list.style.cssText = 'list-style:decimal inside;margin:0 0 2rem;min-height:1.5rem;padding:0;';
    for (const entry of this.hiScoreProvider()) {
      const item = document.createElement('li');
      item.textContent = `${entry.name} — ${entry.score}`;
      list.appendChild(item);
    }
    root.appendChild(list);

    const button = document.createElement('button');
    button.textContent = 'Play game';
    button.style.cssText = 'padding:0.75rem 2rem;font-size:1.2rem;cursor:pointer;';
    button.addEventListener('click', this.onPlayGame);
    root.appendChild(button);

    this.element = root;
    this.container.appendChild(root);
  }

  /** Removes the title-screen overlay from the container. */
  public hide(): void {
    if (this.element !== null) {
      this.element.remove();
      this.element = null;
    }
  }
}
