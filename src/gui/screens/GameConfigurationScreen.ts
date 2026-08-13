import { AVAILABLE_RULE_PRESETS } from '../AvailableRulePresets';

import type { RulePreset } from '../RulePreset';

/** Number of rules the player must select before the game can start. */
const REQUIRED_RULE_COUNT = 3;

/**
 * Renders the game-configuration screen as a full-page DOM overlay.
 *
 * The player selects exactly {@link REQUIRED_RULE_COUNT} rule presets.
 * A "Reset" button clears the selection; "Start game" is enabled only when
 * the correct number of rules are selected.
 *
 * Use {@link GameConfigurationScreen.create} to construct an instance.
 */
export class GameConfigurationScreen {
  private readonly container: HTMLElement;
  private readonly onStartGame: (selected: RulePreset[]) => void;
  private selectedIndices: Set<number>;
  private element: HTMLElement | null;

  private constructor(
    container: HTMLElement,
    onStartGame: (selected: RulePreset[]) => void,
  ) {
    this.container = container;
    this.onStartGame = onStartGame;
    this.selectedIndices = new Set();
    this.element = null;
  }

  /**
   * Creates a {@link GameConfigurationScreen} instance.
   *
   * @param container - DOM element that receives the screen overlay.
   * @param onStartGame - Callback invoked with the selected presets when "Start game" is clicked.
   * @returns A new GameConfigurationScreen instance.
   */
  public static create(
    container: HTMLElement,
    onStartGame: (selected: RulePreset[]) => void,
  ): GameConfigurationScreen {
    return new GameConfigurationScreen(container, onStartGame);
  }

  /** Builds and appends the configuration overlay to the container. */
  public show(): void {
    this.selectedIndices = new Set();

    const root = document.createElement('div');
    root.style.cssText =
      'position:fixed;inset:0;display:flex;flex-direction:column;' +
      'align-items:center;justify-content:center;background:#111;' +
      'color:#fff;font-family:monospace;overflow-y:auto;z-index:10;';

    const heading = document.createElement('h1');
    heading.textContent = 'Configure Game';
    heading.style.cssText = 'font-size:2rem;margin:0 0 0.5rem;';
    root.appendChild(heading);

    const instruction = document.createElement('p');
    instruction.textContent = `Select ${REQUIRED_RULE_COUNT} simulation rules:`;
    instruction.style.cssText = 'margin:0 0 1rem;';
    root.appendChild(instruction);

    const ruleList = document.createElement('div');
    ruleList.style.cssText = 'display:flex;flex-direction:column;gap:0.5rem;margin-bottom:2rem;';

    const checkboxes: HTMLInputElement[] = [];
    const startButton = document.createElement('button');

    for (let i = 0; i < AVAILABLE_RULE_PRESETS.length; i += 1) {
      const preset = AVAILABLE_RULE_PRESETS[i];
      const row = document.createElement('label');
      row.style.cssText = 'display:flex;align-items:center;gap:0.5rem;cursor:pointer;';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.dataset['presetIndex'] = String(i);
      checkbox.addEventListener('change', () => {
        this.handleCheckboxChange(i, checkbox.checked, checkboxes, startButton);
      });
      checkboxes.push(checkbox);

      const label = document.createElement('span');
      label.textContent = `${preset.name} — ${preset.description}`;

      row.appendChild(checkbox);
      row.appendChild(label);
      ruleList.appendChild(row);
    }

    root.appendChild(ruleList);

    const buttonRow = document.createElement('div');
    buttonRow.style.cssText = 'display:flex;gap:1rem;';

    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset';
    resetButton.style.cssText = 'padding:0.5rem 1.5rem;font-size:1rem;cursor:pointer;';
    resetButton.addEventListener('click', () => {
      this.selectedIndices = new Set();
      for (const cb of checkboxes) {
        cb.checked = false;
        cb.disabled = false;
      }
      startButton.disabled = true;
    });
    buttonRow.appendChild(resetButton);

    startButton.textContent = 'Start game';
    startButton.disabled = true;
    startButton.style.cssText = 'padding:0.5rem 1.5rem;font-size:1rem;cursor:pointer;';
    startButton.addEventListener('click', () => {
      const selected = [...this.selectedIndices].map((idx) => AVAILABLE_RULE_PRESETS[idx]);
      this.onStartGame(selected);
    });
    buttonRow.appendChild(startButton);

    root.appendChild(buttonRow);

    this.element = root;
    this.container.appendChild(root);
  }

  /** Removes the configuration overlay from the container. */
  public hide(): void {
    if (this.element !== null) {
      this.element.remove();
      this.element = null;
    }
  }

  private handleCheckboxChange(
    index: number,
    checked: boolean,
    checkboxes: HTMLInputElement[],
    startButton: HTMLButtonElement,
  ): void {
    if (checked) {
      this.selectedIndices.add(index);
    } else {
      this.selectedIndices.delete(index);
    }

    const count = this.selectedIndices.size;
    const limitReached = count >= REQUIRED_RULE_COUNT;

    for (const cb of checkboxes) {
      const cbIndex = Number(cb.dataset['presetIndex']);
      cb.disabled = limitReached && !this.selectedIndices.has(cbIndex);
    }

    startButton.disabled = count !== REQUIRED_RULE_COUNT;
  }
}
