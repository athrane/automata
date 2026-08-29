import { ConfigurableSimulationMode } from "../../../src/simulation/mode/ConfigurableSimulationMode";
import type { RuleSetApplicationStrategy } from "../../../src/simulation/claim/application/RuleSetApplicationStrategy";
import type { ClaimCandidate } from "../../../src/simulation/claim/ClaimCandidate";
import type { CellClaimResolutionStrategy } from "../../../src/simulation/claim/resolution/CellClaimResolutionStrategy";
import type { Grid } from "../../../src/simulation/Grid";
import type { IterationStrategy } from "../../../src/simulation/iteration/IterationStrategy";
import type { GenerationContext } from "../../../src/simulation/mode/GenerationContext";
import type { GridPosition } from "../../../src/simulation/player/GridPosition";
import type { Player } from "../../../src/simulation/player/Player";

/** Builds an iteration strategy that always returns the given cells. */
function createFixedIterationStrategy(cells: GridPosition[]): IterationStrategy {
  return { cellsToVisit: () => cells };
}

/** One call made to the recording rule-set-application strategy. */
interface RecordedBuildCall {
  grid: Grid;
  x: number;
  y: number;
  players: ReadonlyArray<Player>;
  positions: ReadonlyMap<number, GridPosition>;
  generation: number;
  needsAllCandidates: boolean;
}

/** A rule-set-application strategy that records its arguments and returns fixed candidates. */
interface RecordingRuleSetApplicationStrategy extends RuleSetApplicationStrategy {
  calls: RecordedBuildCall[];
}

/** Builds a rule-set-application strategy returning fixed candidates and recording every call. */
function createRecordingRuleSetApplicationStrategy(
  candidates: ClaimCandidate[],
): RecordingRuleSetApplicationStrategy {
  const calls: RecordedBuildCall[] = [];

  return {
    calls,
    buildCandidates(
      grid: Grid,
      x: number,
      y: number,
      players: ReadonlyArray<Player>,
      positions: ReadonlyMap<number, GridPosition>,
      generation: number,
      needsAllCandidates: boolean,
    ): ClaimCandidate[] {
      calls.push({ grid, x, y, players, positions, generation, needsAllCandidates });
      return candidates;
    },
    resolveOwner: () => null,
  };
}

/** Builds a claim-resolution strategy that always returns the given winner. */
function createFixedClaimResolutionStrategy(
  winner: number | null,
  needsAllCandidates = true,
): CellClaimResolutionStrategy {
  return { needsAllCandidates, selectWinner: () => winner };
}

/** Builds a candidate for a player with the given id. */
function createCandidate(id: number): ClaimCandidate {
  return { player: { id, name: `Player ${String(id)}`, rules: [] }, rosterIndex: 0, matchedRuleCount: 1 };
}

/** Builds a 2x2 all-empty grid. */
function createEmptyGrid(): Grid {
  return Array.from({ length: 2 }, () =>
    Array.from({ length: 2 }, () => ({ ownerId: null, value: null })),
  );
}

describe("ConfigurableSimulationMode", () => {
  describe("create", () => {
    it("throws TypeError when no iteration strategy is supplied", () => {
      expect(() =>
        ConfigurableSimulationMode.create(
          null as unknown as IterationStrategy,
          createRecordingRuleSetApplicationStrategy([]),
        ),
      ).toThrow(TypeError);
    });

    it("throws TypeError when no rule-set-application strategy is supplied", () => {
      expect(() =>
        ConfigurableSimulationMode.create(
          createFixedIterationStrategy([]),
          null as unknown as RuleSetApplicationStrategy,
        ),
      ).toThrow(TypeError);
    });
  });

  describe("nextGeneration", () => {
    it("resolves only the cells the iteration strategy yields", () => {
      // Arrange
      const mode = ConfigurableSimulationMode.create(
        createFixedIterationStrategy([{ x: 1, y: 0 }]),
        createRecordingRuleSetApplicationStrategy([createCandidate(5)]),
      );
      const context: GenerationContext = {
        grid: createEmptyGrid(),
        players: [],
        generation: 0,
        positions: new Map(),
        claimStrategy: createFixedClaimResolutionStrategy(5),
      };

      // Act
      const nextGrid = mode.nextGeneration(context);

      // Assert
      expect(nextGrid[0][1]).toEqual({ ownerId: 5, value: 5 });
      expect(nextGrid[0][0]).toEqual({ ownerId: null, value: null });
    });

    it("returns a new grid rather than the one it was given", () => {
      // Arrange
      const mode = ConfigurableSimulationMode.create(
        createFixedIterationStrategy([]),
        createRecordingRuleSetApplicationStrategy([]),
      );
      const grid = createEmptyGrid();
      const context: GenerationContext = {
        grid,
        players: [],
        generation: 0,
        positions: new Map(),
        claimStrategy: createFixedClaimResolutionStrategy(null),
      };

      // Act
      const nextGrid = mode.nextGeneration(context);

      // Assert
      expect(nextGrid).not.toBe(grid);
    });

    it("passes the context's grid, players, positions, and generation to the rule-set-application strategy", () => {
      // Arrange
      const ruleSetApplication = createRecordingRuleSetApplicationStrategy([]);
      const mode = ConfigurableSimulationMode.create(
        createFixedIterationStrategy([{ x: 0, y: 0 }]),
        ruleSetApplication,
      );
      const players: Player[] = [{ id: 1, name: "Player 1", rules: [] }];
      const positions = new Map<number, GridPosition>([[1, { x: 0, y: 0 }]]);
      const context: GenerationContext = {
        grid: createEmptyGrid(),
        players,
        generation: 9,
        positions,
        claimStrategy: createFixedClaimResolutionStrategy(null, false),
      };

      // Act
      mode.nextGeneration(context);

      // Assert
      expect(ruleSetApplication.calls[0]).toMatchObject({
        grid: context.grid,
        x: 0,
        y: 0,
        players,
        positions,
        generation: 9,
        needsAllCandidates: false,
      });
    });

    it("leaves a cell empty when the rule-set-application strategy offers no candidates and no fallback owner", () => {
      // Arrange
      const mode = ConfigurableSimulationMode.create(
        createFixedIterationStrategy([{ x: 0, y: 0 }]),
        createRecordingRuleSetApplicationStrategy([]),
      );
      const context: GenerationContext = {
        grid: createEmptyGrid(),
        players: [],
        generation: 0,
        positions: new Map(),
        claimStrategy: createFixedClaimResolutionStrategy(1),
      };

      // Act
      const nextGrid = mode.nextGeneration(context);

      // Assert
      expect(nextGrid[0][0]).toEqual({ ownerId: null, value: null });
    });

    it("keeps a dormant claim by falling back to resolveOwner when no candidate wins the value", () => {
      // Arrange — no candidates match, but the rule-set-application strategy
      // still reports a persistent owner for the cell.
      const ruleSetApplication = createRecordingRuleSetApplicationStrategy([]);
      ruleSetApplication.resolveOwner = () => 3;
      const mode = ConfigurableSimulationMode.create(
        createFixedIterationStrategy([{ x: 0, y: 0 }]),
        ruleSetApplication,
      );
      const context: GenerationContext = {
        grid: createEmptyGrid(),
        players: [],
        generation: 0,
        positions: new Map(),
        claimStrategy: createFixedClaimResolutionStrategy(null),
      };

      // Act
      const nextGrid = mode.nextGeneration(context);

      // Assert
      expect(nextGrid[0][0]).toEqual({ ownerId: 3, value: null });
    });

    it("prefers the resolved value over the fallback owner when a candidate wins", () => {
      // Arrange
      const ruleSetApplication = createRecordingRuleSetApplicationStrategy([createCandidate(5)]);
      ruleSetApplication.resolveOwner = () => 3;
      const mode = ConfigurableSimulationMode.create(
        createFixedIterationStrategy([{ x: 0, y: 0 }]),
        ruleSetApplication,
      );
      const context: GenerationContext = {
        grid: createEmptyGrid(),
        players: [],
        generation: 0,
        positions: new Map(),
        claimStrategy: createFixedClaimResolutionStrategy(5),
      };

      // Act
      const nextGrid = mode.nextGeneration(context);

      // Assert
      expect(nextGrid[0][0]).toEqual({ ownerId: 5, value: 5 });
    });
  });
});
