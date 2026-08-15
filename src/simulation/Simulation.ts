import type { Cell } from "./Cell";
import { CellClaim } from "./claim/CellClaim";
import type { Grid } from "./Grid";
import type { HiScore } from "./hiscore/HiScore";
import type { HiScoreEntry } from "./hiscore/HiScoreEntry";
import type { StartingPattern } from "./level/StartingPattern";
import type { SimulationMode } from "./mode/SimulationMode";
import type { GridPosition } from "./player/GridPosition";
import type { Player } from "./player/Player";
import type { StartPositioningStrategy } from "./player/StartPositioningStrategy";
import { SimulationOptions } from "./SimulationOptions";
import { wrapCoordinate } from "./WrapCoordinate";

/**
 * Manages the simulation grid and advances it through generations
 * by evaluating player rules.
 */
export class Simulation {
    
  /** Grid width in cells. */
  readonly width: number;

  /** Grid height in cells. */
  readonly height: number;

  /** Current generation number. */
  generation: number;

  /** Players participating in the simulation. */
  private readonly players: Player[];

  /** The simulation grid. */
  private grid: Grid;

  /** Hi-score list this simulation records completed games into. */
  private readonly hiScore: HiScore;

  /** Resolves the owner of each cell in the next generation. */
  private readonly cellClaim: CellClaim;

  /** Each player's cumulative score, added to once per completed generation. */
  private readonly scores: Map<number, number>;

  /** Decides which cells a generation evaluates and whose rules are consulted for them. */
  private readonly mode: SimulationMode;

  /**
   * The cell each player occupies, keyed by player id.
   *
   * Empty until {@link applyStartPositioning} is called, so a game whose mode
   * does not use positions never carries any.
   */
  private readonly positions: Map<number, GridPosition>;

  /**
   * @param options - Configuration for grid dimensions and players.
   */
  private constructor(options: SimulationOptions) {
    this.width = options.width;
    this.height = options.height;
    this.players = options.players;
    this.hiScore = options.hiScore;
    this.cellClaim = CellClaim.create(options.claimStrategy);
    this.mode = options.mode;
    this.positions = new Map();
    this.generation = 0;
    this.grid = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => null as Cell),
    );
    this.scores = new Map(this.players.map((player) => [player.id, 0]));
  }

  /**
   * Creates a new {@link Simulation} instance.
   *
   * @param options - Optional configuration for grid dimensions and players.
   * @returns A new Simulation instance.
   */
  public static create(options?: SimulationOptions): Simulation {
    return new Simulation(options ?? SimulationOptions.create());
  }

  /** Returns a shallow copy of the current grid. */
  getGrid(): Grid {
    return this.grid.map((row) => [...row]);
  }

  /**
   * Returns the players taking part in this simulation, in evaluation order.
   *
   * Callers that need to present the players — a scoreboard, a colour map —
   * should read them from here rather than rebuilding the roster, so their
   * view cannot drift from the one the simulation is running.
   *
   * @returns A readonly view of the registered players.
   */
  public getPlayers(): ReadonlyArray<Player> {
    return this.players;
  }

  /**
   * Assigns every registered player a starting position through `strategy`.
   *
   * Must be called after {@link applyStartingPattern}, since a strategy picks
   * from the cells a player owns in the seeded grid.
   *
   * @param strategy - Chooses the cell each player starts on.
   * @throws {RangeError} If a registered player owns no cell in the grid.
   */
  public applyStartPositioning(strategy: StartPositioningStrategy): void {
    this.positions.clear();

    for (const player of this.players) {
      this.positions.set(player.id, strategy.selectPosition(this.grid, player.id));
    }
  }

  /**
   * Returns the cell a player occupies.
   *
   * @param playerId - The player to look up.
   * @returns That player's position, or undefined when it has none.
   */
  public getPlayerPosition(playerId: number): GridPosition | undefined {
    return this.positions.get(playerId);
  }

  /**
   * Returns the cell each player occupies, keyed by player id.
   *
   * A presenter that draws the positions should read them from here rather
   * than from the grid, so its view cannot drift from the running state.
   *
   * @returns A readonly view of the player positions.
   */
  public getPlayerPositions(): ReadonlyMap<number, GridPosition> {
    return this.positions;
  }

  /**
   * Moves a player by one step, if the target cell is one it may enter.
   *
   * The target wraps at the grid edges, matching the toroidal neighbourhood
   * the rules already use. A cell owned by another player is refused, so a
   * player cannot walk into foreign territory.
   *
   * @param playerId - The player to move.
   * @param dx - Change in x, in cells.
   * @param dy - Change in y, in cells.
   * @returns True when the player moved, false when the move was refused.
   */
  public movePlayer(playerId: number, dx: number, dy: number): boolean {
    const current = this.positions.get(playerId);
    if (current === undefined) {
      return false;
    }

    const targetX = wrapCoordinate(current.x + dx, this.width);
    const targetY = wrapCoordinate(current.y + dy, this.height);
    const owner = this.grid[targetY][targetX];

    if (owner !== null && owner !== playerId) {
      return false;
    }

    this.positions.set(playerId, { x: targetX, y: targetY });

    return true;
  }

  /** Sets the value of a single cell. Out-of-bounds coordinates are ignored. */
  setCell(x: number, y: number, value: Cell): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return;
    }

    this.grid[y][x] = value;
  }

  /**
   * Advances the simulation by one generation and returns the new grid.
   *
   * Which cells are evaluated is decided by the configured
   * {@link SimulationMode}; who owns each of them is decided by the configured
   * claim strategy. See {@link CellClaim}.
   *
   * The generation passed to the mode is the one being read, before the
   * increment below, so a strategy that varies with the generation applies
   * one value to the whole sweep instead of shifting part way through it.
   */
  run(): Grid {
    const nextGrid = this.mode.nextGeneration({
      grid: this.grid,
      players: this.players,
      generation: this.generation,
      positions: this.positions,
      cellClaim: this.cellClaim,
    });

    this.grid = nextGrid;
    this.generation += 1;

    for (const [id, count] of this.getCellCounts()) {
      this.scores.set(id, (this.scores.get(id) ?? 0) + count);
    }

    return this.getGrid();
  }

  /**
   * Returns `true` when at least one cell in the grid is occupied (non-null).
   */
  public hasLivingCells(): boolean {
    return this.grid.some((row) => row.some((cell) => cell !== null));
  }

  /**
   * Counts the living cells owned by each player.
   *
   * Every registered player is present in the result, so a player with no
   * remaining cells reports `0` rather than being omitted.
   *
   * @returns A map from player id to the number of cells that player owns.
   */
  public getCellCounts(): Map<number, number> {
    const counts = new Map<number, number>();
    for (const player of this.players) {
      counts.set(player.id, 0);
    }

    for (const row of this.grid) {
      for (const cell of row) {
        if (cell === null) {
          continue;
        }

        counts.set(cell, (counts.get(cell) ?? 0) + 1);
      }
    }

    return counts;
  }

  /**
   * Returns each player's cumulative score.
   *
   * A player's score is the sum of the living cell count it owned at the end
   * of every generation played so far, so it grows across the game instead
   * of reflecting only the current standing.
   *
   * @returns A readonly map from player id to that player's cumulative score.
   */
  public getScores(): ReadonlyMap<number, number> {
    return new Map(this.scores);
  }

  /**
   * Records a hi-score entry for a completed game.
   *
   * The score is the current generation count, so a player's score is the
   * number of generations the grid survived.
   *
   * @param name - Display name recorded with the entry.
   */
  public recordHiScore(name: string): void {
    this.hiScore.addEntry({ name, score: this.generation });
  }

  /**
   * Returns the current hi-score list in descending score order.
   *
   * Each score is the generation count a completed game reached.
   *
   * @returns A readonly snapshot of the hi-score entries.
   */
  public getHiScores(): ReadonlyArray<HiScoreEntry> {
    return this.hiScore.getEntries();
  }

  /**
   * Overwrites the whole grid with the given starting pattern and resets the
   * generation counter and every player's score to 0.
   *
   * Every cell is assigned unconditionally, unlike {@link seedRandom}, which
   * skips already-occupied cells. A level start must not depend on what the
   * grid held beforehand, so applying the same pattern twice always yields
   * the same grid.
   *
   * @param pattern - Supplies the owner of each cell at generation 0.
   */
  public applyStartingPattern(pattern: StartingPattern): void {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        this.grid[y][x] = pattern.cellAt(x, y);
      }
    }

    this.generation = 0;
    for (const player of this.players) {
      this.scores.set(player.id, 0);
    }
  }

  /**
   * Randomly populates the empty cells of the grid with cells owned by `playerId`.
   *
   * Each empty cell is independently set to `playerId` with probability `density`.
   * Cells that are already occupied are left untouched, so seeding several
   * players in sequence does not let a later player overwrite an earlier one.
   *
   * @param density - Fraction of cells to populate, in the range [0, 1].
   * @param playerId - The player id written into each populated cell.
   * @throws {RangeError} If density is not in the range [0, 1].
   */
  public seedRandom(density: number, playerId: number): void {
    if (density < 0 || density > 1) {
      throw new RangeError('density must be between 0 and 1');
    }
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        if (this.grid[y][x] !== null) {
          continue;
        }

        if (Math.random() < density) {
          this.grid[y][x] = playerId;
        }
      }
    }
  }
}
