import type { ClaimStrategy } from "./claim/ClaimStrategy";
import { FirstMatchClaimStrategy } from "./claim/FirstMatchClaimStrategy";
import { HiScore } from "./hiscore/HiScore";
import { GlobalSimulationMode } from "./mode/GlobalSimulationMode";
import type { SimulationMode } from "./mode/SimulationMode";
import type { Player } from "./player/Player";

/** Default grid width in cells. */
const DEFAULT_WIDTH = 100;

/** Default grid height in cells. */
const DEFAULT_HEIGHT = 100;

/** Configuration options for creating a Simulation instance. */
export class SimulationOptions {
  /** Grid width in cells. */
  readonly width: number;

  /** Grid height in cells. */
  readonly height: number;

  /** Players to include in the simulation. */
  readonly players: Player[];

  /** Hi-score list the simulation records completed games into. */
  readonly hiScore: HiScore;

  /** Decides which player claims a cell matched by more than one of them. */
  readonly claimStrategy: ClaimStrategy;

  /** Decides which cells a generation evaluates and whose rules are consulted for them. */
  readonly mode: SimulationMode;

  private constructor(
    width: number,
    height: number,
    players: Player[],
    hiScore: HiScore,
    claimStrategy: ClaimStrategy,
    mode: SimulationMode,
  ) {
    this.width = width;
    this.height = height;
    this.players = players;
    this.hiScore = hiScore;
    this.claimStrategy = claimStrategy;
    this.mode = mode;
  }

  /**
   * Creates a {@link SimulationOptions} instance.
   *
   * @param width - Grid width in cells. Defaults to 100.
   * @param height - Grid height in cells. Defaults to 100.
   * @param players - Players to include. Defaults to an empty array.
   * @param hiScore - Hi-score list to record into. Defaults to the shared list.
   * @param claimStrategy - Decides contested cells. Defaults to first match in roster order.
   * @param mode - Decides which cells a generation evaluates. Defaults to the global sweep.
   * @returns A validated SimulationOptions instance.
   * @throws {RangeError} If width or height is not positive.
   */
  public static create(
    width?: number,
    height?: number,
    players?: Player[],
    hiScore?: HiScore,
    claimStrategy?: ClaimStrategy,
    mode?: SimulationMode,
  ): SimulationOptions {
    const resolvedWidth = width ?? DEFAULT_WIDTH;
    const resolvedHeight = height ?? DEFAULT_HEIGHT;
    const resolvedPlayers = players ?? [];
    const resolvedHiScore = hiScore ?? HiScore.shared();
    const resolvedClaimStrategy = claimStrategy ?? FirstMatchClaimStrategy.create();
    const resolvedMode = mode ?? GlobalSimulationMode.create();

    if (resolvedWidth <= 0) {
      throw new RangeError("width must be a positive number");
    }
    if (resolvedHeight <= 0) {
      throw new RangeError("height must be a positive number");
    }

    return new SimulationOptions(
      resolvedWidth,
      resolvedHeight,
      resolvedPlayers,
      resolvedHiScore,
      resolvedClaimStrategy,
      resolvedMode,
    );
  }
}
