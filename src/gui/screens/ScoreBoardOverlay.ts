import type { GameParticipant } from '../GameParticipant';

/** Number of hex digits in a CSS colour, used when padding the participant colour. */
const HEX_COLOR_LENGTH = 6;

/** Score shown for a participant that is missing from a score map. */
const UNKNOWN_SCORE = 0;

/**
 * Renders the in-game scoreboard as an overlay pinned to the top centre of the
 * viewport, showing one row per participant with a colour swatch and that
 * participant's current score.
 *
 * Use {@link ScoreBoardOverlay.create} to construct an instance.
 */
export class ScoreBoardOverlay {
  private readonly container: HTMLElement;
  private readonly scoreLabels: Map<number, HTMLElement>;
  private element: HTMLElement | null;

  private constructor(container: HTMLElement) {
    this.container = container;
    this.scoreLabels = new Map<number, HTMLElement>();
    this.element = null;
  }

  /**
   * Creates a {@link ScoreBoardOverlay} instance.
   *
   * @param container - DOM element that receives the overlay.
   * @returns A new ScoreBoardOverlay instance.
   */
  public static create(container: HTMLElement): ScoreBoardOverlay {
    return new ScoreBoardOverlay(container);
  }

  /**
   * Builds one scoreboard row per participant and appends the overlay to the container.
   *
   * @param participants - The players to show, in display order.
   */
  public show(participants: ReadonlyArray<GameParticipant>): void {
    const root = document.createElement('div');
    root.style.cssText =
      'position:fixed;top:1rem;left:50%;transform:translateX(-50%);' +
      'display:flex;gap:1.5rem;padding:0.5rem 1rem;' +
      'background:rgba(0,0,0,0.6);color:#fff;font-family:monospace;' +
      'font-size:1rem;z-index:20;';

    for (const participant of participants) {
      root.appendChild(this.createRow(participant));
    }

    this.element = root;
    this.container.appendChild(root);
  }

  /**
   * Writes the supplied scores into the existing rows.
   * Participants missing from the map are shown as {@link UNKNOWN_SCORE}.
   *
   * @param scores - Map from player id to that player's current score.
   */
  public update(scores: ReadonlyMap<number, number>): void {
    for (const [id, label] of this.scoreLabels) {
      label.textContent = String(scores.get(id) ?? UNKNOWN_SCORE);
    }
  }

  /** Removes the scoreboard overlay from the container. */
  public hide(): void {
    if (this.element !== null) {
      this.element.remove();
      this.element = null;
    }
    this.scoreLabels.clear();
  }

  /**
   * Builds a single scoreboard row and registers its score label for later updates.
   *
   * @param participant - The player the row represents.
   * @returns The row element, ready to append.
   */
  private createRow(participant: GameParticipant): HTMLElement {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:0.5rem;';

    const swatch = document.createElement('span');
    const hex = participant.color.toString(16).padStart(HEX_COLOR_LENGTH, '0');
    swatch.style.cssText = `width:0.75rem;height:0.75rem;background:#${hex};`;
    row.appendChild(swatch);

    const name = document.createElement('span');
    name.textContent = participant.player.name;
    row.appendChild(name);

    const score = document.createElement('span');
    score.textContent = String(UNKNOWN_SCORE);
    row.appendChild(score);

    this.scoreLabels.set(participant.player.id, score);

    return row;
  }
}
