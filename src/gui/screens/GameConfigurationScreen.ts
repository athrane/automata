import { AVAILABLE_CLAIM_STRATEGIES } from '../AvailableClaimStrategies';
import { AVAILABLE_ITERATION_STRATEGIES } from '../AvailableIterationStrategies';
import { AVAILABLE_LEVELS } from '../AvailableLevels';
import { AVAILABLE_RULE_PRESETS } from '../AvailableRulePresets';
import { AVAILABLE_RULE_SET_APPLICATIONS } from '../AvailableRuleSetApplications';
import { AVAILABLE_SIMULATION_MODES } from '../AvailableSimulationModes';
import { AVAILABLE_STARTING_PATTERNS } from '../AvailableStartingPatterns';
import { AVAILABLE_START_POSITIONINGS } from '../AvailableStartPositionings';
import { requiresStartPositioning, resolveSimulationMode } from '../CustomSimulationModeSelection';
import { selectRandomPresetIndices } from '../RandomRulePresetSelection';
import { createCustomLevel } from '../../simulation';
import { createAsciiDivider, formatBracketed, formatPrompted } from '../design/AsciiOrnament';
import { DESIGN_CLASS } from '../design/DesignClasses';

import type { Level, SimulationMode, StartPositioningStrategy } from '../../simulation';
import type { GameConfiguration } from '../GameConfiguration';

/** Number of rules the player must select before the game can start. */
const REQUIRED_RULE_COUNT = 3;

/** Heading shown at the top of the configuration screen. */
const SCREEN_TITLE = 'Configure';

/** Value of the level `<select>`'s option that switches on the custom-level controls. */
const CUSTOM_LEVEL_OPTION_VALUE = 'custom';

/** Value of the mode `<select>`'s option that switches on the custom-mode controls. */
const CUSTOM_MODE_OPTION_VALUE = 'custom';

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
  private isCustomModeSelected: boolean;
  private selectedIterationStrategyIndex: number;
  private selectedRuleSetApplicationIndex: number;

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
    this.isCustomModeSelected = false;
    this.selectedIterationStrategyIndex = 0;
    this.selectedRuleSetApplicationIndex = 0;
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
    this.isCustomModeSelected = false;
    this.selectedIterationStrategyIndex = 0;
    this.selectedRuleSetApplicationIndex = 0;

    const root = document.createElement('div');
    root.className = DESIGN_CLASS.SCREEN;

    const heading = document.createElement('h1');
    heading.textContent = formatBracketed(SCREEN_TITLE);
    heading.className = DESIGN_CLASS.TITLE;
    root.appendChild(heading);

    root.appendChild(createAsciiDivider());

    this.buildModeControls(root);
    this.buildLevelControls(root);

    const instruction = document.createElement('p');
    instruction.textContent = formatPrompted(`Select ${String(REQUIRED_RULE_COUNT)} rules`);
    instruction.className = DESIGN_CLASS.HEADING;
    root.appendChild(instruction);

    const ruleList = document.createElement('div');
    ruleList.className = DESIGN_CLASS.STACK;

    const checkboxes: HTMLInputElement[] = [];
    const startButton = document.createElement('button');

    for (let i = 0; i < AVAILABLE_RULE_PRESETS.length; i += 1) {
      const preset = AVAILABLE_RULE_PRESETS[i];
      const row = document.createElement('label');
      row.className = DESIGN_CLASS.ROW;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = DESIGN_CLASS.CHECK;
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

    root.appendChild(createAsciiDivider());

    const buttonRow = document.createElement('div');
    buttonRow.className = DESIGN_CLASS.ROW;

    startButton.textContent = 'Start game';
    startButton.disabled = this.selectedIndices.size !== REQUIRED_RULE_COUNT;
    startButton.className = DESIGN_CLASS.BUTTON;
    startButton.addEventListener('click', () => {
      const selected = [...this.selectedIndices].map((idx) => AVAILABLE_RULE_PRESETS[idx]);
      this.onStartGame({
        level: this.resolveSelectedLevel(),
        presets: selected,
        mode: this.resolveSelectedMode(),
        startPositioning: this.resolveSelectedStartPositioning(),
      });
    });
    buttonRow.appendChild(startButton);

    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset';
    resetButton.className = DESIGN_CLASS.BUTTON;
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
   * Builds the "Game mode" select, the custom-mode controls it can reveal, and
   * the player-positioning picker, appending all three to `root`.
   *
   * The positioning picker is shown only while the effective mode needs
   * positions, using the same `style.display` toggle as the custom-level
   * controls.
   */
  private buildModeControls(root: HTMLElement): void {
    const modeHeading = document.createElement('p');
    modeHeading.textContent = formatPrompted('Game mode');
    modeHeading.className = DESIGN_CLASS.HEADING;
    root.appendChild(modeHeading);

    const positioningControls = document.createElement('div');
    positioningControls.className = DESIGN_CLASS.STACK;
    positioningControls.style.display = 'none';
    positioningControls.appendChild(
      this.buildOptionSelect('Player positioning:', AVAILABLE_START_POSITIONINGS, (index) => {
        this.selectedStartPositioningIndex = index;
      }),
    );

    const updatePositioningVisibility = (): void => {
      positioningControls.style.display = this.resolveRequiresStartPositioning() ? 'flex' : 'none';
    };

    const modeSelect = document.createElement('select');
    modeSelect.className = DESIGN_CLASS.SELECT;

    for (let i = 0; i < AVAILABLE_SIMULATION_MODES.length; i += 1) {
      const option = document.createElement('option');
      option.value = String(i);
      option.textContent = AVAILABLE_SIMULATION_MODES[i].name;
      modeSelect.appendChild(option);
    }

    const customOption = document.createElement('option');
    customOption.value = CUSTOM_MODE_OPTION_VALUE;
    customOption.textContent = 'Custom';
    modeSelect.appendChild(customOption);

    root.appendChild(modeSelect);

    const customModeControls = this.buildCustomModeControls(updatePositioningVisibility);
    root.appendChild(customModeControls);
    root.appendChild(positioningControls);

    modeSelect.addEventListener('change', () => {
      if (modeSelect.value === CUSTOM_MODE_OPTION_VALUE) {
        this.isCustomModeSelected = true;
        customModeControls.style.display = 'flex';
      } else {
        this.isCustomModeSelected = false;
        this.selectedModeIndex = Number(modeSelect.value);
        customModeControls.style.display = 'none';
      }
      updatePositioningVisibility();
    });
  }

  /**
   * Builds the iteration-strategy and rule-set-application pickers for a
   * custom simulation mode, hidden until "Custom" is chosen.
   *
   * @param onIterationStrategyChange - Invoked after the iteration strategy changes, to refresh positioning visibility.
   */
  private buildCustomModeControls(onIterationStrategyChange: () => void): HTMLElement {
    const customModeControls = document.createElement('div');
    customModeControls.className = DESIGN_CLASS.STACK;
    customModeControls.style.display = 'none';

    customModeControls.appendChild(
      this.buildOptionSelect('Iteration strategy:', AVAILABLE_ITERATION_STRATEGIES, (index) => {
        this.selectedIterationStrategyIndex = index;
        onIterationStrategyChange();
      }),
    );
    customModeControls.appendChild(
      this.buildOptionSelect('Rule-set application:', AVAILABLE_RULE_SET_APPLICATIONS, (index) => {
        this.selectedRuleSetApplicationIndex = index;
      }),
    );

    return customModeControls;
  }

  /**
   * Builds the "Choose a level" select and the custom-level controls it reveals,
   * and appends both to `root`.
   */
  private buildLevelControls(root: HTMLElement): void {
    const levelHeading = document.createElement('p');
    levelHeading.textContent = formatPrompted('Level');
    levelHeading.className = DESIGN_CLASS.HEADING;
    root.appendChild(levelHeading);

    const levelSelect = document.createElement('select');
    levelSelect.className = DESIGN_CLASS.SELECT;

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
    customControls.className = DESIGN_CLASS.STACK;
    customControls.style.display = 'none';

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
    label.className = DESIGN_CLASS.FIELD;

    const select = document.createElement('select');
    select.className = DESIGN_CLASS.SELECT;

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

  /** Resolves the mode to play: the selected preset, or a freshly built custom pairing. */
  private resolveSelectedMode(): SimulationMode {
    return resolveSimulationMode(
      this.isCustomModeSelected,
      this.selectedModeIndex,
      this.selectedIterationStrategyIndex,
      this.selectedRuleSetApplicationIndex,
    );
  }

  /** Resolves whether the effective mode needs every player placed on the grid. */
  private resolveRequiresStartPositioning(): boolean {
    return requiresStartPositioning(
      this.isCustomModeSelected,
      this.selectedModeIndex,
      this.selectedIterationStrategyIndex,
    );
  }

  /** Resolves the positioning strategy to play with, or null for a mode without positions. */
  private resolveSelectedStartPositioning(): StartPositioningStrategy | null {
    if (!this.resolveRequiresStartPositioning()) {
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
