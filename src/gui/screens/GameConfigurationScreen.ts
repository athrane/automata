import { AVAILABLE_CLAIM_STRATEGIES } from '../AvailableClaimStrategies';
import { AVAILABLE_LEVELS } from '../AvailableLevels';
import { AVAILABLE_RULE_PRESETS } from '../AvailableRulePresets';
import { AVAILABLE_SIMULATION_MODES } from '../AvailableSimulationModes';
import { AVAILABLE_STARTING_PATTERNS } from '../AvailableStartingPatterns';
import { AVAILABLE_START_POSITIONINGS } from '../AvailableStartPositionings';
import { selectRandomPresetIndices } from '../RandomRulePresetSelection';
import { createCustomLevel } from '../../simulation';

import type { Level, StartPositioningStrategy } from '../../simulation';
import type { GameConfiguration } from '../GameConfiguration';

/** Number of rules the player must select before the game can start. */
const REQUIRED_RULE_COUNT = 3;

/** Value of the level `<select>`'s option that switches on the custom-level controls. */
const CUSTOM_LEVEL_OPTION_VALUE = 'custom';

/**
 * Renders the game-configuration screen as a full-page DOM overlay.
 *
 * The player picks a game mode — one of {@link AVAILABLE_SIMULATION_MODES} —
 * a level — one of {@link AVAILABLE_LEVELS} or a custom combination of a
 * starting pattern and a claim strategy — and selects exactly
 * {@link REQUIRED_RULE_COUNT} rule presets. A mode that places players on the
 * grid also reveals a positioning picker. Each time the screen is shown,
 * {@link REQUIRED_RULE_COUNT} presets are preselected at random, so the screen
 * opens in a startable state. A "Reset" button clears that preselection;
 * "Start game" is enabled only when the correct number of rules are selected.
 *
 * Use {@link GameConfigurationScreen.create} to construct an instance.
 */
export class GameConfigurationScreen {
  private readonly container: HTMLElement;
  private readonly onStartGame: (configuration: GameConfiguration) => void;
  private selectedIndices: Set<number>;
  private element: HTMLElement | null;
  private selectedLevel: Level;
  private isCustomLevelSelected: boolean;
  private selectedStartingPatternIndex: number;
  private selectedClaimStrategyIndex: number;
  private selectedModeIndex: number;
  private selectedStartPositioningIndex: number;

  private constructor(
    container: HTMLElement,
    onStartGame: (configuration: GameConfiguration) => void,
  ) {
    this.container = container;
    this.onStartGame = onStartGame;
    this.selectedIndices = new Set();
    this.element = null;
    this.selectedLevel = AVAILABLE_LEVELS[0];
    this.isCustomLevelSelected = false;
    this.selectedStartingPatternIndex = 0;
    this.selectedClaimStrategyIndex = 0;
    this.selectedModeIndex = 0;
    this.selectedStartPositioningIndex = 0;
  }

  /**
   * Creates a {@link GameConfigurationScreen} instance.
   *
   * @param container - DOM element that receives the screen overlay.
   * @param onStartGame - Callback invoked with the assembled configuration when "Start game" is clicked.
   * @returns A new GameConfigurationScreen instance.
   */
  public static create(
    container: HTMLElement,
    onStartGame: (configuration: GameConfiguration) => void,
  ): GameConfigurationScreen {
    return new GameConfigurationScreen(container, onStartGame);
  }

  /** Builds and appends the configuration overlay to the container. */
  public show(): void {
    this.selectedIndices = new Set();
    this.selectedLevel = AVAILABLE_LEVELS[0];
    this.isCustomLevelSelected = false;
    this.selectedStartingPatternIndex = 0;
    this.selectedClaimStrategyIndex = 0;
    this.selectedModeIndex = 0;
    this.selectedStartPositioningIndex = 0;

    const root = document.createElement('div');
    root.style.cssText =
      'position:fixed;inset:0;display:flex;flex-direction:column;' +
      'align-items:center;justify-content:center;background:#111;' +
      'color:#fff;font-family:monospace;overflow-y:auto;z-index:10;';

    const heading = document.createElement('h1');
    heading.textContent = 'Configure Game';
    heading.style.cssText = 'font-size:2rem;margin:0 0 0.5rem;';
    root.appendChild(heading);

    this.buildModeControls(root);
    this.buildLevelControls(root);

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

    const preselected = selectRandomPresetIndices(
      AVAILABLE_RULE_PRESETS.length,
      REQUIRED_RULE_COUNT,
      Math.random,
    );
    for (const index of preselected) {
      this.selectedIndices.add(index);
    }
    const limitReached = this.selectedIndices.size >= REQUIRED_RULE_COUNT;
    for (let i = 0; i < checkboxes.length; i += 1) {
      const isSelected = this.selectedIndices.has(i);
      checkboxes[i].checked = isSelected;
      checkboxes[i].disabled = limitReached && !isSelected;
    }

    root.appendChild(ruleList);

    const buttonRow = document.createElement('div');
    buttonRow.style.cssText = 'display:flex;gap:1rem;';

    startButton.textContent = 'Start game';
    startButton.disabled = this.selectedIndices.size !== REQUIRED_RULE_COUNT;
    startButton.style.cssText = 'padding:0.5rem 1.5rem;font-size:1rem;cursor:pointer;';
    startButton.addEventListener('click', () => {
      const selected = [...this.selectedIndices].map((idx) => AVAILABLE_RULE_PRESETS[idx]);
      this.onStartGame({
        level: this.resolveSelectedLevel(),
        presets: selected,
        mode: AVAILABLE_SIMULATION_MODES[this.selectedModeIndex].mode,
        startPositioning: this.resolveSelectedStartPositioning(),
      });
    });
    buttonRow.appendChild(startButton);

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

  /**
   * Builds the "Game mode" select and the player-positioning picker it reveals,
   * and appends both to `root`.
   *
   * The positioning picker is shown only while the selected mode needs
   * positions, using the same `style.display` toggle as the custom-level
   * controls.
   */
  private buildModeControls(root: HTMLElement): void {
    const modeHeading = document.createElement('p');
    modeHeading.textContent = 'Choose a game mode:';
    modeHeading.style.cssText = 'margin:0 0 0.5rem;';
    root.appendChild(modeHeading);

    const positioningControls = document.createElement('div');
    positioningControls.style.cssText =
      'display:none;flex-direction:column;gap:0.5rem;margin-bottom:1rem;';
    positioningControls.appendChild(
      this.buildOptionSelect('Player positioning:', AVAILABLE_START_POSITIONINGS, (index) => {
        this.selectedStartPositioningIndex = index;
      }),
    );

    const modeSelect = this.buildOptionSelect(
      'Game mode:',
      AVAILABLE_SIMULATION_MODES,
      (index) => {
        this.selectedModeIndex = index;
        positioningControls.style.display =
          AVAILABLE_SIMULATION_MODES[index].requiresStartPositioning ? 'flex' : 'none';
      },
    );
    modeSelect.style.cssText = 'margin-bottom:1rem;';

    root.appendChild(modeSelect);
    root.appendChild(positioningControls);
  }

  /**
   * Builds the "Choose a level" select and the custom-level controls it reveals,
   * and appends both to `root`.
   */
  private buildLevelControls(root: HTMLElement): void {
    const levelHeading = document.createElement('p');
    levelHeading.textContent = 'Choose a level:';
    levelHeading.style.cssText = 'margin:0 0 0.5rem;';
    root.appendChild(levelHeading);

    const levelSelect = document.createElement('select');
    levelSelect.style.cssText = 'padding:0.4rem;font-size:1rem;margin-bottom:1rem;';

    for (let i = 0; i < AVAILABLE_LEVELS.length; i += 1) {
      const option = document.createElement('option');
      option.value = String(i);
      option.textContent = AVAILABLE_LEVELS[i].name;
      levelSelect.appendChild(option);
    }

    const customOption = document.createElement('option');
    customOption.value = CUSTOM_LEVEL_OPTION_VALUE;
    customOption.textContent = 'Custom';
    levelSelect.appendChild(customOption);

    root.appendChild(levelSelect);

    const customControls = this.buildCustomLevelControls();
    root.appendChild(customControls);

    levelSelect.addEventListener('change', () => {
      if (levelSelect.value === CUSTOM_LEVEL_OPTION_VALUE) {
        this.isCustomLevelSelected = true;
        customControls.style.display = 'flex';
      } else {
        this.isCustomLevelSelected = false;
        this.selectedLevel = AVAILABLE_LEVELS[Number(levelSelect.value)];
        customControls.style.display = 'none';
      }
    });
  }

  /** Builds the starting-pattern and claim-strategy pickers, hidden until "Custom" is chosen. */
  private buildCustomLevelControls(): HTMLElement {
    const customControls = document.createElement('div');
    customControls.style.cssText =
      'display:none;flex-direction:column;gap:0.5rem;margin-bottom:1rem;';

    customControls.appendChild(
      this.buildOptionSelect('Starting pattern:', AVAILABLE_STARTING_PATTERNS, (index) => {
        this.selectedStartingPatternIndex = index;
      }),
    );
    customControls.appendChild(
      this.buildOptionSelect('Claim strategy:', AVAILABLE_CLAIM_STRATEGIES, (index) => {
        this.selectedClaimStrategyIndex = index;
      }),
    );

    return customControls;
  }

  /** Builds a labelled `<select>` populated from `options`, reporting the chosen index. */
  private buildOptionSelect(
    labelText: string,
    options: ReadonlyArray<{ readonly name: string }>,
    onChange: (index: number) => void,
  ): HTMLLabelElement {
    const label = document.createElement('label');
    label.textContent = labelText;

    const select = document.createElement('select');
    select.style.cssText = 'padding:0.4rem;font-size:1rem;margin-left:0.5rem;';

    for (let i = 0; i < options.length; i += 1) {
      const option = document.createElement('option');
      option.value = String(i);
      option.textContent = options[i].name;
      select.appendChild(option);
    }

    select.addEventListener('change', () => {
      onChange(Number(select.value));
    });

    label.appendChild(select);
    return label;
  }

  /** Resolves the level to play: the selected fixed level, or a freshly built custom one. */
  private resolveSelectedLevel(): Level {
    if (!this.isCustomLevelSelected) {
      return this.selectedLevel;
    }

    return createCustomLevel(
      AVAILABLE_STARTING_PATTERNS[this.selectedStartingPatternIndex].pattern,
      AVAILABLE_CLAIM_STRATEGIES[this.selectedClaimStrategyIndex].strategy,
    );
  }

  /** Resolves the positioning strategy to play with, or null for a mode without positions. */
  private resolveSelectedStartPositioning(): StartPositioningStrategy | null {
    if (!AVAILABLE_SIMULATION_MODES[this.selectedModeIndex].requiresStartPositioning) {
      return null;
    }

    return AVAILABLE_START_POSITIONINGS[this.selectedStartPositioningIndex].strategy;
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
