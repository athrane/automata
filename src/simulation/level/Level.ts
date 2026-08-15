import type { ClaimStrategy } from "../claim/ClaimStrategy";
import { FirstMatchClaimStrategy } from "../claim/FirstMatchClaimStrategy";
import type { HiScore } from "../hiscore/HiScore";
import type { SimulationMode } from "../mode/SimulationMode";
import type { Player } from "../player/Player";
import type { StartPositioningStrategy } from "../player/StartPositioningStrategy";
import type { Rule } from "../rule/Rule";
import { Simulation } from "../Simulation";
import { SimulationOptions } from "../SimulationOptions";
import type { LevelRoster } from "./LevelRoster";
import type { StartingPattern } from "./StartingPattern";

/**
 * A level: everything that defines how a game begins.
 *
 * A level fixes the grid dimensions, the pattern written into the grid before
 * the first generation, the participants, and the rules each computer player
 * starts with. It deliberately does not fix the human player's rules — those
 * are chosen by the player and passed to {@link createPlayers} or
 * {@link createSimulation}.
 *
 * Because every other input is fixed, two games started from the same level
 * with the same human rules evolve identically.
 *
 * Use the static factory method {@link Level.create} to construct an instance.
 */
export class Level {
  /** Unique identifier of this level. */
  readonly id: number;

  /** Display name of this level. */
  readonly name: string;

  /** Grid width in cells. */
  readonly width: number;

  /** Grid height in cells. */
  readonly height: number;

  /** The participants of this level. */
  readonly roster: LevelRoster;

  /** The state of the grid at generation 0. */
  readonly startingPattern: StartingPattern;

  /** Decides which player claims a cell matched by more than one of them. */
  readonly claimStrategy: ClaimStrategy;

  private constructor(
    id: number,
    name: string,
    width: number,
    height: number,
    roster: LevelRoster,
    startingPattern: StartingPattern,
    claimStrategy: ClaimStrategy,
  ) {
    this.id = id;
    this.name = name;
    this.width = width;
    this.height = height;
    this.roster = roster;
    this.startingPattern = startingPattern;
    this.claimStrategy = claimStrategy;
  }

  /**
   * Creates a {@link Level} instance.
   *
   * @param id - Unique identifier of the level.
   * @param name - Display name of the level.
   * @param width - Grid width in cells.
   * @param height - Grid height in cells.
   * @param roster - The human slot and the computer players.
   * @param startingPattern - The state of the grid at generation 0.
   * @param claimStrategy - Decides contested cells. Defaults to first match in roster order.
   * @returns A validated Level instance.
   * @throws {RangeError} If width or height is not positive, or the roster has no computer players.
   * @throws {Error} If the human and computer players do not all have distinct ids.
   */
  public static create(
    id: number,
    name: string,
    width: number,
    height: number,
    roster: LevelRoster,
    startingPattern: StartingPattern,
    claimStrategy?: ClaimStrategy,
  ): Level {
    if (width <= 0) {
      throw new RangeError("width must be a positive number");
    }
    if (height <= 0) {
      throw new RangeError("height must be a positive number");
    }
    if (roster.computers.length === 0) {
      throw new RangeError("computers must not be empty");
    }

    // The starting pattern addresses players by id, so a duplicate would make
    // the owner of a block ambiguous.
    const ids = [roster.human.id, ...roster.computers.map((player) => player.id)];
    if (new Set(ids).size !== ids.length) {
      throw new Error("player ids must be unique");
    }

    return new Level(
      id,
      name,
      width,
      height,
      roster,
      startingPattern,
      claimStrategy ?? FirstMatchClaimStrategy.create(),
    );
  }

  /**
   * Assembles the full roster, giving the human player the supplied rules.
   *
   * The human is placed first, which is both the scoreboard order and the
   * rule-evaluation order used by {@link Simulation.run}.
   *
   * @param humanRules - Rules chosen by the human player.
   * @returns The players of a single game.
   * @throws {RangeError} If humanRules is empty.
   */
  public createPlayers(humanRules: Rule[]): Player[] {
    if (humanRules.length === 0) {
      throw new RangeError("humanRules must not be empty");
    }

    const human: Player = {
      id: this.roster.human.id,
      name: this.roster.human.name,
      rules: humanRules,
    };

    return [human, ...this.roster.computers];
  }

  /**
   * Builds a simulation of this level, ready to run.
   *
   * The returned simulation is at generation 0 with the starting pattern
   * already applied, so the caller only has to advance it.
   *
   * When a positioning strategy is supplied, every player is placed on the
   * grid after the pattern has been applied, since a strategy picks from the
   * cells a player owns at generation 0.
   *
   * @param humanRules - Rules chosen by the human player.
   * @param hiScore - Hi-score list to record into. Defaults to the shared list.
   * @param mode - Decides which cells a generation evaluates. Defaults to the global sweep.
   * @param startPositioning - Places each player on the grid. Omitted for a game without positions.
   * @returns A Simulation seeded with this level's starting pattern.
   * @throws {RangeError} If humanRules is empty.
   */
  public createSimulation(
    humanRules: Rule[],
    hiScore?: HiScore,
    mode?: SimulationMode,
    startPositioning?: StartPositioningStrategy,
  ): Simulation {
    const players = this.createPlayers(humanRules);
    const options = SimulationOptions.create(
      this.width,
      this.height,
      players,
      hiScore,
      this.claimStrategy,
      mode,
    );
    const simulation = Simulation.create(options);

    simulation.applyStartingPattern(this.startingPattern);

    if (startPositioning !== undefined) {
      simulation.applyStartPositioning(startPositioning);
    }

    return simulation;
  }
}
