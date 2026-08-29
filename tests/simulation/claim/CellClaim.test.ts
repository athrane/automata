import { CellClaim } from "../../../src/simulation/claim/CellClaim";
import type { RuleSetApplicationStrategy } from "../../../src/simulation/claim/application/RuleSetApplicationStrategy";
import type { ClaimCandidate } from "../../../src/simulation/claim/ClaimCandidate";
import type { ClaimContext } from "../../../src/simulation/claim/ClaimContext";
import type { CellClaimResolutionStrategy } from "../../../src/simulation/claim/resolution/CellClaimResolutionStrategy";
import type { Grid } from "../../../src/simulation/Grid";
import type { GridPosition } from "../../../src/simulation/player/GridPosition";
import type { Player } from "../../../src/simulation/player/Player";

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

/** One call made to the recording claim-resolution strategy. */
interface RecordedSelectCall {
  candidates: ReadonlyArray<ClaimCandidate>;
  context: ClaimContext;
}

/** A claim-resolution strategy that records its arguments and returns a fixed winner. */
interface RecordingClaimResolutionStrategy extends CellClaimResolutionStrategy {
  calls: RecordedSelectCall[];
}

/** Builds a claim-resolution strategy that always returns the given winner and records every call. */
function createRecordingClaimResolutionStrategy(
  winner: number | null,
  needsAllCandidates = true,
): RecordingClaimResolutionStrategy {
  const calls: RecordedSelectCall[] = [];

  return {
    calls,
    needsAllCandidates,
    selectWinner(
      candidates: ReadonlyArray<ClaimCandidate>,
      context: ClaimContext,
    ): number | null {
      calls.push({ candidates, context });
      return winner;
    },
  };
}

/** Builds a player with the given id and no rules. */
function createPlayer(id: number): Player {
  return { id, name: `Player ${String(id)}`, rules: [] };
}

/** Builds a candidate for a player with the given id. */
function createCandidate(id: number, rosterIndex = 0, matchedRuleCount = 1): ClaimCandidate {
  return { player: createPlayer(id), rosterIndex, matchedRuleCount };
}

/** Builds a 2x2 grid with the given owners, row-major. */
function createGrid(owners: ReadonlyArray<number | null>): Grid {
  return [
    [
      { ownerId: owners[0] ?? null, value: owners[0] ?? null },
      { ownerId: owners[1] ?? null, value: owners[1] ?? null },
    ],
    [
      { ownerId: owners[2] ?? null, value: owners[2] ?? null },
      { ownerId: owners[3] ?? null, value: owners[3] ?? null },
    ],
  ];
}

describe("CellClaim", () => {
  describe("create", () => {
    it("throws TypeError when no rule-set-application strategy is supplied", () => {
      expect(() =>
        CellClaim.create(
          null as unknown as RuleSetApplicationStrategy,
          createRecordingClaimResolutionStrategy(1),
        ),
      ).toThrow(TypeError);
    });

    it("throws TypeError when the rule-set-application strategy is undefined", () => {
      expect(() =>
        CellClaim.create(
          undefined as unknown as RuleSetApplicationStrategy,
          createRecordingClaimResolutionStrategy(1),
        ),
      ).toThrow("ruleSetApplication must be provided");
    });

    it("throws TypeError when no claim-resolution strategy is supplied", () => {
      expect(() =>
        CellClaim.create(
          createRecordingRuleSetApplicationStrategy([]),
          null as unknown as CellClaimResolutionStrategy,
        ),
      ).toThrow(TypeError);
    });

    it("throws TypeError when the claim-resolution strategy is undefined", () => {
      expect(() =>
        CellClaim.create(
          createRecordingRuleSetApplicationStrategy([]),
          undefined as unknown as CellClaimResolutionStrategy,
        ),
      ).toThrow("claimResolution must be provided");
    });
  });

  describe("resolve", () => {
    it("returns null without consulting the claim-resolution strategy when no candidates are built", () => {
      const ruleSetApplication = createRecordingRuleSetApplicationStrategy([]);
      const claimResolution = createRecordingClaimResolutionStrategy(1);
      const claim = CellClaim.create(ruleSetApplication, claimResolution);

      const winner = claim.resolve(createGrid([null, null, null, null]), 0, 0, [], new Map(), 0);

      expect(winner).toBeNull();
      expect(claimResolution.calls).toHaveLength(0);
    });

    it("returns the winner chosen by the claim-resolution strategy", () => {
      const ruleSetApplication = createRecordingRuleSetApplicationStrategy([createCandidate(2)]);
      const claimResolution = createRecordingClaimResolutionStrategy(2);
      const claim = CellClaim.create(ruleSetApplication, claimResolution);

      const winner = claim.resolve(createGrid([null, null, null, null]), 0, 0, [], new Map(), 0);

      expect(winner).toBe(2);
    });

    it("passes the grid, coordinates, players, positions, and generation to the rule-set-application strategy", () => {
      const ruleSetApplication = createRecordingRuleSetApplicationStrategy([]);
      const claimResolution = createRecordingClaimResolutionStrategy(1);
      const claim = CellClaim.create(ruleSetApplication, claimResolution);
      const grid = createGrid([null, null, null, null]);
      const players: Player[] = [createPlayer(1)];
      const positions: Map<number, GridPosition> = new Map([[1, { x: 0, y: 0 }]]);

      claim.resolve(grid, 1, 0, players, positions, 7);

      expect(ruleSetApplication.calls[0]).toMatchObject({
        grid,
        x: 1,
        y: 0,
        players,
        positions,
        generation: 7,
      });
    });

    it("passes the claim-resolution strategy's needsAllCandidates hint to the rule-set-application strategy", () => {
      const ruleSetApplication = createRecordingRuleSetApplicationStrategy([]);
      const claimResolution = createRecordingClaimResolutionStrategy(1, false);
      const claim = CellClaim.create(ruleSetApplication, claimResolution);

      claim.resolve(createGrid([null, null, null, null]), 0, 0, [], new Map(), 0);

      expect(ruleSetApplication.calls[0].needsAllCandidates).toBe(false);
    });

    it("passes the built candidates to the claim-resolution strategy", () => {
      const candidates = [createCandidate(1), createCandidate(2)];
      const ruleSetApplication = createRecordingRuleSetApplicationStrategy(candidates);
      const claimResolution = createRecordingClaimResolutionStrategy(1);
      const claim = CellClaim.create(ruleSetApplication, claimResolution);

      claim.resolve(createGrid([null, null, null, null]), 0, 0, [], new Map(), 0);

      expect(claimResolution.calls[0].candidates).toBe(candidates);
    });

    it("passes the cell coordinates and the grid being read to the claim-resolution strategy", () => {
      const ruleSetApplication = createRecordingRuleSetApplicationStrategy([createCandidate(1)]);
      const claimResolution = createRecordingClaimResolutionStrategy(1);
      const claim = CellClaim.create(ruleSetApplication, claimResolution);
      const grid = createGrid([null, null, null, null]);

      claim.resolve(grid, 1, 0, [], new Map(), 0);

      expect(claimResolution.calls[0].context.grid).toBe(grid);
      expect(claimResolution.calls[0].context.x).toBe(1);
      expect(claimResolution.calls[0].context.y).toBe(0);
    });

    it("passes the current owner of the cell to the claim-resolution strategy", () => {
      const ruleSetApplication = createRecordingRuleSetApplicationStrategy([createCandidate(1)]);
      const claimResolution = createRecordingClaimResolutionStrategy(1);
      const claim = CellClaim.create(ruleSetApplication, claimResolution);

      claim.resolve(createGrid([null, null, 7, null]), 0, 1, [], new Map(), 0);

      expect(claimResolution.calls[0].context.owner).toBe(7);
    });

    it("reads the owner from the persistent claim, not the current value", () => {
      const ruleSetApplication = createRecordingRuleSetApplicationStrategy([createCandidate(1)]);
      const claimResolution = createRecordingClaimResolutionStrategy(1);
      const claim = CellClaim.create(ruleSetApplication, claimResolution);
      const grid: Grid = [
        [
          { ownerId: null, value: null },
          { ownerId: null, value: null },
        ],
        [
          { ownerId: 7, value: null },
          { ownerId: null, value: null },
        ],
      ];

      claim.resolve(grid, 0, 1, [], new Map(), 0);

      expect(claimResolution.calls[0].context.owner).toBe(7);
    });

    it("passes the supplied generation and the roster size to the claim-resolution strategy", () => {
      const ruleSetApplication = createRecordingRuleSetApplicationStrategy([createCandidate(1)]);
      const claimResolution = createRecordingClaimResolutionStrategy(1);
      const claim = CellClaim.create(ruleSetApplication, claimResolution);
      const players: Player[] = [createPlayer(1), createPlayer(2), createPlayer(3)];

      claim.resolve(createGrid([null, null, null, null]), 0, 0, players, new Map(), 12);

      expect(claimResolution.calls[0].context.generation).toBe(12);
      expect(claimResolution.calls[0].context.playerCount).toBe(3);
    });

    it("returns null when the claim-resolution strategy declines to award the cell", () => {
      const ruleSetApplication = createRecordingRuleSetApplicationStrategy([createCandidate(1)]);
      const claimResolution = createRecordingClaimResolutionStrategy(null);
      const claim = CellClaim.create(ruleSetApplication, claimResolution);

      const winner = claim.resolve(createGrid([null, null, null, null]), 0, 0, [], new Map(), 0);

      expect(winner).toBeNull();
    });
  });
});
