import type { HiScoreEntry } from '../../simulation';
import { createAsciiDivider, formatBracketed, formatPrompted } from '../design/AsciiOrnament';
import { DESIGN_CLASS } from '../design/DesignClasses';

/** Display title shown at the top of the title screen. */
const GAME_TITLE = 'Automata';

/** Number of digits a hi-score rank is padded to, so every entry lines up. */
const RANK_DIGITS = 2;

/** Character width the player name is padded to in a hi-score entry. */
const NAME_COLUMNS = 12;

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
    root.className = DESIGN_CLASS.SCREEN;

    const title = document.createElement('h1');
    title.textContent = formatBracketed(GAME_TITLE);
    title.className = DESIGN_CLASS.TITLE;
    root.appendChild(title);

    root.appendChild(createAsciiDivider());

    const hiScoreHeading = document.createElement('h2');
    hiScoreHeading.textContent = formatPrompted('Hi-Score');
    hiScoreHeading.className = DESIGN_CLASS.HEADING;
    root.appendChild(hiScoreHeading);

    const list = document.createElement('ol');
    list.className = DESIGN_CLASS.LIST;
    const entries = this.hiScoreProvider();
    for (let i = 0; i < entries.length; i += 1) {
      const item = document.createElement('li');
      item.textContent = this.formatEntry(i, entries[i]);
      list.appendChild(item);
    }
    root.appendChild(list);

    root.appendChild(createAsciiDivider());

    const button = document.createElement('button');
    button.textContent = 'Play game';
    button.className = DESIGN_CLASS.BUTTON;
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

  /**
   * Lays one hi-score entry out on the character grid, so ranks, names, and
   * scores line up in columns without a table.
   *
   * @param index - Zero-based position of the entry in the list.
   * @param entry - The entry to render.
   * @returns The entry as a single padded line.
   */
  private formatEntry(index: number, entry: HiScoreEntry): string {
    const rank = String(index + 1).padStart(RANK_DIGITS, '0');

    return `${rank}  ${entry.name.padEnd(NAME_COLUMNS)}${String(entry.score)}`;
  }
}
