## Title

`feat(simulation): generalize generation computation into configurable iteration, rule-application, and claim-resolution strategies`

## Summary
Generalizes how a simulation computes its next generation by splitting the per-generation loop into three independently swappable strategies — which cells to visit, which players' rules apply to a visited cell and how they combine into candidates, and which candidate wins a contested cell — with `GlobalSimulationMode` and `PlayerLocalSimulationMode` reimplemented as named presets over the same generic engine rather than two separate hand-written loops. The duplicated Moore-neighbourhood-plus-wrap lookup in `SumRule`, `GeometryRule`, and `NeighbourMajorityClaimStrategy` is also extracted into a single shared `NeighborhoodUtils` static class.

## Motivation
The computation of a generation was hardcoded twice: `GlobalSimulationMode` and `PlayerLocalSimulationMode` each contained their own full traversal-plus-resolution loop, differing only in which cells they visited and how many candidate players they offered to `CellClaim` for each — a distinction with no seam a caller could configure independently. A player cannot today assemble a custom generation model (a different cell-visitation policy paired with a different rule-eligibility policy) without writing an entirely new `SimulationMode` from scratch and re-deriving both loops. Separately, three call sites (`SumRule`, `GeometryRule`, `NeighbourMajorityClaimStrategy`) each re-declared the same 8-neighbour offset table and the same `wrapCoordinate` loop, so a change to the neighbourhood shape (e.g. a future non-Moore neighbourhood) would require three synchronized edits.

## Changes

### Files Deleted
- None

### Files Updated

- **`src/simulation/NeighborhoodUtils.ts`** *(new file)* — Static class exposing `NeighborhoodUtils.forEachMooreNeighbor(width, height, x, y, visit: (nx, ny, index) => void)`, iterating the 8 wrapped Moore-neighbour coordinates in the fixed offset order (top-left → bottom-right) and invoking `visit` with each wrapped coordinate and its offset index. Owns the single `NEIGHBOR_OFFSETS` table and the `wrapCoordinate` calls that were previously duplicated in three files.
- **`src/simulation/rule/SumRule.ts`** — `matches` replaces its inline double `for` loop over `[-1,0,1]` offsets with a call to `NeighborhoodUtils.forEachMooreNeighbor`, counting matches inside the callback; the `includeSelf` central-cell check is applied before delegating (the shared utility never visits the centre cell, matching today's default-excluded behaviour), so `includeSelf` counts the centre separately from the callback.
- **`src/simulation/rule/GeometryRule.ts`** — `matches` replaces its indexed `for` loop over `NEIGHBOR_OFFSETS` with `NeighborhoodUtils.forEachMooreNeighbor`, using the callback's `index` parameter to look up `this.pattern[index]` in the same order as before.
- **`src/simulation/claim/resolution/NeighbourMajorityClaimStrategy.ts`** — `countNeighbours` replaces its local `NEIGHBOR_OFFSETS` constant and loop with `NeighborhoodUtils.forEachMooreNeighbor`, counting neighbours whose `ownerId` matches the candidate inside the callback.
- **`src/simulation/claim/application/RuleSetApplicationStrategy.ts`** *(new file)* — Interface with `buildCandidates(grid, x, y, players, positions, generation, needsAllCandidates): ClaimCandidate[]`, owning the full first stage of cell resolution: which of the roster's players are even eligible for cell `(x, y)`, and how many of each eligible player's rules match. `needsAllCandidates` is threaded through from the configured `CellClaimResolutionStrategy` so an implementation can preserve today's early-stop-at-first-match optimisation.
- **`src/simulation/claim/application/GlobalRuleSetApplicationStrategy.ts`** *(new file)* — Every player in the roster is eligible; for each, in roster order, counts matched rules and pushes a candidate when `matchedRuleCount > 0`, stopping early when `needsAllCandidates` is false. This is `CellClaim.resolve`'s current inline loop, moved verbatim into its own class and reused as `GlobalSimulationMode`'s default.
- **`src/simulation/claim/application/PlayerLocalRuleSetApplicationStrategy.ts`** *(new file)* — Eligibility is restricted to whichever player(s) either own cell `(x, y)` (`grid[y][x].ownerId`) or currently occupy it (`positions`) — normally exactly one player, since `Simulation.movePlayer` already refuses to move a player onto a cell owned by someone else, so an owned cell and another player's position can never coincide; a genuine multi-player tie is possible only on an unowned cell two players' positions both resolve to, and is left to the configured `CellClaimResolutionStrategy` to break by roster order exactly as an ordinary contested cell would be. Runs the same matched-rule-counting loop as the global strategy, scoped to the eligible player(s).
- **`src/simulation/claim/application/index.ts`** *(new file)* — Barrel exporting `RuleSetApplicationStrategy`, `GlobalRuleSetApplicationStrategy`, and `PlayerLocalRuleSetApplicationStrategy`.
- **`src/simulation/claim/CellClaim.ts`** — `create` now takes `(ruleSetApplication: RuleSetApplicationStrategy, claimResolution: CellClaimResolutionStrategy)` instead of a single strategy; `resolve` gains a `positions: ReadonlyMap<number, GridPosition>` parameter, delegates candidate-building to `this.ruleSetApplication.buildCandidates(...)` instead of its inline loop, and passes `this.claimResolution.needsAllCandidates` through so the early-stop behaviour is unchanged. The two-stage resolution (candidates, then winner) is now two delegated calls instead of one inline loop plus one delegated call.
- **`src/simulation/mode/iteration/IterationStrategy.ts`** *(new file)* — Interface with `cellsToVisit(context: GenerationContext): Iterable<GridPosition>`, owning which cells a generation evaluates at all (independent of who is eligible once visited).
- **`src/simulation/mode/iteration/SweepAllCellsIterationStrategy.ts`** *(new file)* — Yields every `(x, y)` of `context.grid`, in row-major order — `GlobalSimulationMode`'s current full sweep, extracted verbatim.
- **`src/simulation/mode/iteration/PlayerLocalIterationStrategy.ts`** *(new file)* — Yields the union of every currently-owned cell (`ownerId !== null`) and every cell in `context.positions.values()`, de-duplicated by coordinate — `PlayerLocalSimulationMode`'s current `bucketCellsByOwner` plus per-player `evaluatedCells` union, re-expressed as a single flat cell set instead of a per-player traversal, since eligibility is now decided later, per cell, by `PlayerLocalRuleSetApplicationStrategy`.
- **`src/simulation/mode/iteration/index.ts`** *(new file)* — Barrel exporting `IterationStrategy`, `SweepAllCellsIterationStrategy`, and `PlayerLocalIterationStrategy`.
- **`src/simulation/mode/ConfigurableSimulationMode.ts`** *(new file)* — The generalized engine: constructed from `(iterationStrategy: IterationStrategy, ruleSetApplicationStrategy: RuleSetApplicationStrategy)`. `nextGeneration(context)` builds one `CellClaim` per call from its own fixed `ruleSetApplicationStrategy` and `context.claimStrategy`, then for every cell `this.iterationStrategy.cellsToVisit(context)` yields, resolves it through that `CellClaim` and writes `{ ownerId: result, value: result }` into a freshly allocated grid — the single generation-loop shape both presets and any hand-assembled custom combination now share.
- **`src/simulation/mode/GlobalSimulationMode.ts`** — `nextGeneration` is removed; `create()` now returns `ConfigurableSimulationMode.create(SweepAllCellsIterationStrategy.create(), GlobalRuleSetApplicationStrategy.create())`. The class becomes a named, zero-argument preset factory; its public API (`GlobalSimulationMode.create(): SimulationMode`) is unchanged.
- **`src/simulation/mode/PlayerLocalSimulationMode.ts`** — `nextGeneration`, `bucketCellsByOwner`, and `evaluatedCells` are removed; `create()` now returns `ConfigurableSimulationMode.create(PlayerLocalIterationStrategy.create(), PlayerLocalRuleSetApplicationStrategy.create())`. Its own `resolvedCells` roster-order tie-break bookkeeping is deleted, since a genuinely tied cell now reaches `CellClaimResolutionStrategy` as an ordinary multi-candidate cell and is resolved there instead.
- **`src/simulation/mode/GenerationContext.ts`** — `cellClaim: CellClaim` is replaced with `claimStrategy: CellClaimResolutionStrategy`; a `SimulationMode` implementation now builds its own `CellClaim` from its fixed rule-set-application strategy plus this context field, rather than receiving an already-assembled `CellClaim`.
- **`src/simulation/Simulation.ts`** — The constructor no longer builds `this.cellClaim = CellClaim.create(options.claimStrategy)`; it stores `private readonly claimStrategy: CellClaimResolutionStrategy = options.claimStrategy` instead, and `run()` passes `claimStrategy: this.claimStrategy` into the context object instead of a prebuilt `cellClaim`.
- **`src/simulation/mode/index.ts`** — Adds `ConfigurableSimulationMode` to the barrel's exports, alongside the existing `GlobalSimulationMode`/`PlayerLocalSimulationMode` exports and the `iteration` re-export.
- **`src/simulation/index.ts`** — Re-exports `ConfigurableSimulationMode`, `IterationStrategy`, `SweepAllCellsIterationStrategy`, `PlayerLocalIterationStrategy`, `RuleSetApplicationStrategy`, `GlobalRuleSetApplicationStrategy`, `PlayerLocalRuleSetApplicationStrategy`, and `NeighborhoodUtils` through the top-level barrel, matching how `CellClaimResolutionStrategy` and its implementations are already exported.
- **`tests/simulation/NeighborhoodUtils.test.ts`** *(new file)* — Unit coverage for `forEachMooreNeighbor`: visits exactly 8 coordinates in the documented order, wraps at every edge and corner, and passes the correct index for each offset.
- **`tests/simulation/rule/SumRule.test.ts`**, **`tests/simulation/rule/GeometryRule.test.ts`** — No behavioural assertions change; re-run as a regression check that delegating to `NeighborhoodUtils` reproduces identical match results.
- **`tests/simulation/claim/resolution/NeighbourMajorityClaimStrategy.test.ts`** — No behavioural assertions change; re-run as a regression check for the same reason.
- **`tests/simulation/claim/application/GlobalRuleSetApplicationStrategy.test.ts`** *(new file)* — Every roster player is offered as a candidate when their rules match; a non-matching player is omitted; the early-stop behaviour still applies when `needsAllCandidates` is false.
- **`tests/simulation/claim/application/PlayerLocalRuleSetApplicationStrategy.test.ts`** *(new file)* — Only the owning player is offered a candidate for an owned cell; only the occupying player is offered one for an unowned-but-occupied cell; a cell neither owned nor occupied by any roster player yields no candidates; two players positioned on the same unowned cell both appear as candidates, in roster order.
- **`tests/simulation/claim/CellClaim.test.ts`** — Updated to construct `CellClaim` via `CellClaim.create(ruleSetApplicationStrategy, claimResolutionStrategy)` and to pass a `positions` map into `resolve`; existing assertions about candidate ordering, early-stop, and null-when-unmatched are preserved by supplying a `GlobalRuleSetApplicationStrategy`-equivalent stub.
- **`tests/simulation/mode/iteration/SweepAllCellsIterationStrategy.test.ts`**, **`tests/simulation/mode/iteration/PlayerLocalIterationStrategy.test.ts`** *(new files)* — Verify the exact cell sets each strategy yields, including the owned-cell-union-position case and de-duplication.
- **`tests/simulation/mode/ConfigurableSimulationMode.test.ts`** *(new file)* — Verifies the engine calls the injected iteration strategy for the cell set, delegates each cell through a `CellClaim` built from the injected rule-set-application strategy and `context.claimStrategy`, and returns a freshly allocated grid.
- **`tests/simulation/mode/GlobalSimulationMode.test.ts`**, **`tests/simulation/mode/PlayerLocalSimulationMode.test.ts`** — No behavioural assertions change; re-run as the primary regression gate proving both presets still produce identical output to today's hand-written loops.
- **`tests/integration/ClaimStrategyGame.test.ts`**, **`tests/simulation/level/Level.test.ts`**, **`tests/simulation/level/CustomLevel.test.ts`**, **`tests/simulation/Simulation.test.ts`** — No behavioural assertions change; re-run as end-to-end regression coverage across `Level` → `Simulation` → generations.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [x] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Test coverage improvement

## Implementation Plan

### Phase 1 — Extract the shared Moore-neighbourhood lookup

**Pre-condition**: `SumRule.ts`, `GeometryRule.ts`, and `NeighbourMajorityClaimStrategy.ts` each independently declare a `NEIGHBOR_OFFSETS` table and loop over it with their own `wrapCoordinate` calls.

1. Create `src/simulation/NeighborhoodUtils.ts` declaring `export class NeighborhoodUtils` with a single static method `forEachMooreNeighbor(width: number, height: number, x: number, y: number, visit: (nx: number, ny: number, index: number) => void): void`, moving the shared `NEIGHBOR_OFFSETS` table (currently duplicated in `GeometryRule.ts` and `NeighbourMajorityClaimStrategy.ts`) into this file and using `wrapCoordinate` internally, since a single indexed callback covers all three existing call sites (`SumRule` ignores the index, `GeometryRule` uses it to look up its pattern, `NeighbourMajorityClaimStrategy` ignores it).
2. Update `src/simulation/rule/SumRule.ts`'s `matches` to call `NeighborhoodUtils.forEachMooreNeighbor`, counting same-player neighbours inside the callback and adding the `includeSelf` centre-cell check separately (the utility never visits the centre), since `SumRule` is the one call site that optionally counts the centre cell.
3. Update `src/simulation/rule/GeometryRule.ts`'s `matches` to call `NeighborhoodUtils.forEachMooreNeighbor`, using the callback's `index` to compare against `this.pattern[index]` and returning `false` on the first mismatch, preserving today's early-return-on-mismatch behaviour.
4. Update `src/simulation/claim/resolution/NeighbourMajorityClaimStrategy.ts`'s `countNeighbours` to call `NeighborhoodUtils.forEachMooreNeighbor`, counting neighbours whose `ownerId` equals the candidate's id inside the callback, and delete its now-unused local `NEIGHBOR_OFFSETS` constant.
5. Add `tests/simulation/NeighborhoodUtils.test.ts` covering wrapping at every edge and corner and the documented visitation order, and re-run `SumRule.test.ts`, `GeometryRule.test.ts`, and `NeighbourMajorityClaimStrategy.test.ts` unchanged to confirm identical match results after delegating.

**Post-condition**: `SumRule`, `GeometryRule`, and `NeighbourMajorityClaimStrategy` all resolve neighbours through `NeighborhoodUtils`, no file outside it declares a `NEIGHBOR_OFFSETS` table, and every existing rule/claim-resolution test still passes unchanged.

### Phase 2 — Introduce the rule-set-application strategy and refactor `CellClaim`

**Pre-condition**: Phase 1 is complete; `CellClaim.resolve` still contains its own inline loop that builds candidates from the full roster it is given, with no notion of per-cell eligibility.

1. Create `src/simulation/claim/application/RuleSetApplicationStrategy.ts` declaring `buildCandidates(grid: Grid, x: number, y: number, players: ReadonlyArray<Player>, positions: ReadonlyMap<number, GridPosition>, generation: number, needsAllCandidates: boolean): ClaimCandidate[]`, since candidate-building (who is eligible for a cell, and how their rules combine) is the seam the two current modes actually differ on today.
2. Create `src/simulation/claim/application/GlobalRuleSetApplicationStrategy.ts` implementing it by moving `CellClaim.resolve`'s current loop — every roster player, in order, counted and pushed as a candidate when `matchedRuleCount > 0`, stopping early when `needsAllCandidates` is false — verbatim out of `CellClaim` and into this class.
3. Create `src/simulation/claim/application/PlayerLocalRuleSetApplicationStrategy.ts` implementing it by first narrowing `players` to whichever roster player(s) own `(x, y)` or currently occupy it per `positions`, then running the same matched-rule-counting loop scoped to that narrowed set, since this is `PlayerLocalSimulationMode`'s current single-candidate restriction re-expressed as a per-cell eligibility filter instead of a per-player traversal.
4. Update `src/simulation/claim/CellClaim.ts`: change `create` to `create(ruleSetApplication: RuleSetApplicationStrategy, claimResolution: CellClaimResolutionStrategy)`, add a `positions` parameter to `resolve`, and replace the inline candidate-building loop with `this.ruleSetApplication.buildCandidates(grid, x, y, players, positions, generation, this.claimResolution.needsAllCandidates)`, since `CellClaim` now only orchestrates two delegated calls instead of owning the first stage itself.
5. Add `tests/simulation/claim/application/GlobalRuleSetApplicationStrategy.test.ts` and `PlayerLocalRuleSetApplicationStrategy.test.ts`, and update `tests/simulation/claim/CellClaim.test.ts` to construct `CellClaim` with both strategies and pass a `positions` map into every `resolve` call, preserving its existing assertions about ordering, early-stop, and the null-when-unmatched case.

**Post-condition**: `CellClaim.resolve` contains no inline candidate-building logic, `npm run test` passes with the new and updated test files, and `GlobalRuleSetApplicationStrategy`/`PlayerLocalRuleSetApplicationStrategy` are unit-tested in isolation from any `SimulationMode`.

**Dependencies**: Depends on Phase 1 only incidentally (no shared files); ordered first because `CellClaim`'s new shape is a prerequisite for Phase 3's generic engine.

### Phase 3 — Introduce the iteration strategy and the generic `ConfigurableSimulationMode` engine

**Pre-condition**: Phase 2 is complete; `CellClaim` accepts a `RuleSetApplicationStrategy`, but `GlobalSimulationMode` and `PlayerLocalSimulationMode` still each contain their own full traversal loop and build their own `CellClaim` indirectly through `GenerationContext`.

1. Create `src/simulation/mode/iteration/IterationStrategy.ts` declaring `cellsToVisit(context: GenerationContext): Iterable<GridPosition>`, since which cells a generation visits is the second axis the two current modes differ on.
2. Create `src/simulation/mode/iteration/SweepAllCellsIterationStrategy.ts` yielding every `(x, y)` of `context.grid` in row-major order — `GlobalSimulationMode.nextGeneration`'s current double loop, extracted verbatim — and `src/simulation/mode/iteration/PlayerLocalIterationStrategy.ts` yielding the de-duplicated union of every owned cell (`ownerId !== null`) and every `context.positions` value, replacing `PlayerLocalSimulationMode`'s current `bucketCellsByOwner`-plus-per-player-`evaluatedCells` traversal with a single flat cell set.
3. Update `src/simulation/mode/GenerationContext.ts`: replace `cellClaim: CellClaim` with `claimStrategy: CellClaimResolutionStrategy`, since the pre-assembled `CellClaim` no longer exists at the `Simulation` level — each `SimulationMode` now builds its own from its fixed rule-set-application strategy plus this field.
4. Create `src/simulation/mode/ConfigurableSimulationMode.ts` implementing `SimulationMode`, constructed from `(iterationStrategy: IterationStrategy, ruleSetApplicationStrategy: RuleSetApplicationStrategy)`; `nextGeneration(context)` builds `CellClaim.create(this.ruleSetApplicationStrategy, context.claimStrategy)` once, then for every cell `this.iterationStrategy.cellsToVisit(context)` yields, resolves it through that `CellClaim` and writes the result into a freshly allocated grid exactly as both current modes do today.
5. Update `src/simulation/mode/GlobalSimulationMode.ts` and `src/simulation/mode/PlayerLocalSimulationMode.ts`: delete their `nextGeneration` bodies (and, for the latter, `bucketCellsByOwner`, `evaluatedCells`, and the `resolvedCells` tie-break bookkeeping, since a genuinely tied cell now reaches `CellClaimResolutionStrategy` as an ordinary multi-candidate cell), and have `create()` return a `ConfigurableSimulationMode` built from the matching iteration and rule-set-application preset, so both classes keep their existing zero-argument public factory signature.
6. Update `src/simulation/Simulation.ts`: replace `private readonly cellClaim: CellClaim` with `private readonly claimStrategy: CellClaimResolutionStrategy = options.claimStrategy`, and update `run()` to pass `claimStrategy: this.claimStrategy` into the context object instead of a prebuilt `cellClaim`.
7. Add `tests/simulation/mode/iteration/SweepAllCellsIterationStrategy.test.ts`, `PlayerLocalIterationStrategy.test.ts`, and `tests/simulation/mode/ConfigurableSimulationMode.test.ts`; re-run `tests/simulation/mode/GlobalSimulationMode.test.ts` and `PlayerLocalSimulationMode.test.ts` unchanged as the primary proof that both presets still behave identically to their pre-refactor hand-written loops.

**Post-condition**: `GlobalSimulationMode` and `PlayerLocalSimulationMode` contain no generation-loop logic of their own, `ConfigurableSimulationMode` is the single generic engine both presets and any hand-assembled combination of iteration/rule-application strategies run through, and the full test suite passes with no behavioural change to either existing mode.

**Dependencies**: Depends on Phase 2 (`CellClaim`'s new `(ruleSetApplication, claimResolution)` constructor shape).

### Phase 4 — Barrel exports and end-to-end regression pass

**Pre-condition**: Phases 1–3 are complete and each pass their own local tests.

1. Update `src/simulation/mode/index.ts` to export `ConfigurableSimulationMode` and re-export the new `iteration` barrel; update `src/simulation/claim/index.ts` (or add a re-export) to surface the new `application` barrel; update `src/simulation/index.ts` to re-export `ConfigurableSimulationMode`, `IterationStrategy`, `SweepAllCellsIterationStrategy`, `PlayerLocalIterationStrategy`, `RuleSetApplicationStrategy`, `GlobalRuleSetApplicationStrategy`, `PlayerLocalRuleSetApplicationStrategy`, and `NeighborhoodUtils`, mirroring how `CellClaimResolutionStrategy` and its implementations are already exported today.
2. Run `npm run test` in full and confirm `tests/integration/ClaimStrategyGame.test.ts`, `tests/simulation/level/Level.test.ts`, `tests/simulation/level/CustomLevel.test.ts`, and `tests/simulation/Simulation.test.ts` all pass unchanged, since these are the existing end-to-end paths (`Level` → `Simulation` → generations) most likely to surface a subtle behavioural drift from Phases 2–3.
3. Run `npm run lint`, `npm run typecheck`, and `npm run build` to confirm the new files and barrel changes compile and lint cleanly under the project's strict TypeScript configuration.
4. Update `README.md`'s "Game modes" section to describe `ConfigurableSimulationMode` as the generic engine `GlobalSimulationMode` and `PlayerLocalSimulationMode` are now presets of, and how a caller assembles a custom combination of `IterationStrategy` and `RuleSetApplicationStrategy` directly in code (GUI exposure is out of scope for this PR).

**Post-condition**: The new public API surface is reachable through the existing barrel chain exactly like every other simulation extensibility point, the full validation pipeline (`lint`, `test`, `typecheck`, `build`) passes, and `README.md` documents the new configurable engine.

**Dependencies**: Depends on Phases 1–3 being complete.

## Testing

### TypeScript unit tests

This PR has not been implemented yet — it captures the design and a phased implementation plan only, produced by walking through the four numbered requirements with a structured design interview (see Additional Notes) before any code was written. The test files listed in the Changes section above (`NeighborhoodUtils.test.ts`, `GlobalRuleSetApplicationStrategy.test.ts`, `PlayerLocalRuleSetApplicationStrategy.test.ts`, `SweepAllCellsIterationStrategy.test.ts`, `PlayerLocalIterationStrategy.test.ts`, `ConfigurableSimulationMode.test.ts`) are new and do not exist yet; the remaining listed test files exist today and are expected to require only mechanical updates (or no changes at all) to keep passing once the corresponding phase lands.

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests passing (`npm run test`) — not run, no implementation exists yet

**Test coverage**: Not applicable yet — see the per-phase step 5/7 test additions in the Implementation Plan above for what each phase's coverage will consist of.

### Manual validation steps

| # | Check | How to verify |
|---|-------|---------------|
| 1 | Both existing game modes produce identical output to today's behaviour after the refactor | Re-run `tests/simulation/mode/GlobalSimulationMode.test.ts` and `PlayerLocalSimulationMode.test.ts` unchanged, plus `tests/integration/ClaimStrategyGame.test.ts`, and confirm no assertion needed to change |
| 2 | A hand-assembled custom combination of iteration + rule-application strategies runs end to end | Construct `ConfigurableSimulationMode.create(customIterationStrategy, customRuleSetApplicationStrategy)`, pass it as `SimulationOptions.mode`, and run several generations, confirming the returned grid only ever contains cells the custom iteration strategy could have visited |
| 3 | No file outside `NeighborhoodUtils.ts` declares a Moore-neighbour offset table | `grep -rn "NEIGHBOR_OFFSETS"` across `src/` returns exactly one declaration, in `NeighborhoodUtils.ts` |

## Documentation Plan

| File | Changes |
|------|---------|
| `README.md` | Extend the "Game modes" section to describe `ConfigurableSimulationMode` as the generic engine both `GlobalSimulationMode` and `PlayerLocalSimulationMode` are presets of, and show how to assemble a custom `IterationStrategy` + `RuleSetApplicationStrategy` combination in code. |

## Related Issues
No issue number was supplied for this PR. If a tracking issue exists, add `Closes #<n>` here before opening the PR.

## Checklist
- [ ] Code follows project conventions (static factory methods, TypeUtils validation, etc.) — not yet implemented
- [ ] TypeScript types are correct (`npm run typecheck` passes) — not run, no implementation exists yet
- [ ] Code lints without errors (`npm run lint` passes) — not run, no implementation exists yet
- [ ] All tests pass (`npm run test` passes) — not run, no implementation exists yet
- [ ] Build succeeds (`npm run build` passes) — not run, no implementation exists yet
- [ ] JSDoc comments added for public APIs — not yet implemented
- [ ] Updated documentation (if applicable) — planned in Phase 4, not yet done
- [x] No breaking changes (or documented in PR description) — `GlobalSimulationMode.create()` and `PlayerLocalSimulationMode.create()` keep their existing zero-argument public signatures; `SimulationOptions`/`Level`'s public constructor parameters are unchanged
- [ ] Commit messages follow Conventional Commits format — pending implementation

## Additional Notes
This description was produced with the `grill-me` structured design interview before any implementation, since the request involved several materially different architectural forks. Four decisions were made:

1. **Mode scope** — `GlobalSimulationMode` and `PlayerLocalSimulationMode` are reimplemented as presets over the new generic engine (rather than left untouched with the engine bolted on as a third mode), so the duplication between them is actually eliminated.
2. **Iteration scope** — the iteration strategy yields a flat set of cells with no attached candidate/player scoping.
3. **Rule-application scope** — because of (2), per-cell player eligibility needed a home; it was given to the rule-set-application strategy, which now owns both "who is eligible for this cell" and "how their rules combine," alongside its own `CellClaim` refactor.
4. **Neighbourhood scope** — the duplicated neighbour lookup is extracted into a shared, non-configurable static utility (`NeighborhoodUtils`) rather than a fourth injectable strategy, since the stated requirement was to deduplicate existing logic, not to make neighbourhood shape itself configurable.

One consequence worth flagging to reviewers: `PlayerLocalSimulationMode`'s current `resolvedCells` Set — a manual roster-order tie-break for the rare case where two players' positions coincide on the same unowned cell — is deleted rather than ported, because once eligibility is decided per cell inside `PlayerLocalRuleSetApplicationStrategy`, a genuine tie between two eligible players is just an ordinary multi-candidate cell, and the already-configured `CellClaimResolutionStrategy` (by default `FirstMatchClaimStrategy`, which breaks ties by roster order) resolves it the same way the deleted bookkeeping did — this is a simplification, not a behavioural change, but it removes a code path the current tests may exercise directly rather than through `CellClaimResolutionStrategy`, so those specific assertions should be re-pointed during Phase 3 rather than assumed to carry over unchanged.

Whether the game-configuration GUI screen should expose a "Custom" mode option letting a player pick iteration/rule-application/claim strategies interactively was raised during the design interview and deliberately scoped out — the four numbered requirements describe the simulation engine's internals, not GUI wiring, so this PR only makes the engine configurable in code. GUI exposure is left as separate follow-up work.
