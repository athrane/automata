/**
 * Number of animation frames each generation is held on screen, ordered from
 * the slowest level to the fastest. The fastest level advances one generation
 * per frame, which is the highest rate the renderer supports.
 */
const SPEED_LEVELS: ReadonlyArray<number> = [16, 8, 4, 2, 1];

/** Index of the level a new instance starts at — the fastest level. */
const DEFAULT_LEVEL_INDEX = SPEED_LEVELS.length - 1;

/**
 * Models the discrete simulation speed levels available during gameplay.
 *
 * The level is an index into {@link SPEED_LEVELS}; {@link speedUp} and
 * {@link slowDown} clamp at the ends of that table, so the player can never
 * request a rate the renderer cannot deliver.
 *
 * Use the static factory method {@link SimulationSpeed.create} to construct an instance.
 */
export class SimulationSpeed {
  private levelIndex: number;

  private constructor() {
    this.levelIndex = DEFAULT_LEVEL_INDEX;
  }

  /**
   * Creates a {@link SimulationSpeed} at the fastest level.
   *
   * @returns A new SimulationSpeed instance.
   */
  public static create(): SimulationSpeed {
    return new SimulationSpeed();
  }

  /** Moves one level slower. Does nothing when already at the slowest level. */
  public slowDown(): void {
    if (this.isAtMinimum()) {
      return;
    }

    this.levelIndex -= 1;
  }

  /** Moves one level faster. Does nothing when already at the fastest level. */
  public speedUp(): void {
    if (this.isAtMaximum()) {
      return;
    }

    this.levelIndex += 1;
  }

  /**
   * Returns the current level as a 1-based number suitable for display.
   *
   * @returns A number in the range [1, {@link getLevelCount}].
   */
  public getLevel(): number {
    return this.levelIndex + 1;
  }

  /**
   * Returns the total number of speed levels.
   *
   * @returns The size of the speed level table.
   */
  public getLevelCount(): number {
    return SPEED_LEVELS.length;
  }

  /**
   * Returns how many animation frames each generation is held for at the current level.
   *
   * @returns A positive number of frames per generation.
   */
  public getFramesPerGeneration(): number {
    return SPEED_LEVELS[this.levelIndex];
  }

  /** Returns `true` when the current level is the slowest available. */
  public isAtMinimum(): boolean {
    return this.levelIndex === 0;
  }

  /** Returns `true` when the current level is the fastest available. */
  public isAtMaximum(): boolean {
    return this.levelIndex === SPEED_LEVELS.length - 1;
  }
}
