## Title

`refactor(claim): group cell claim resolution strategies under resolution/`

## Summary
Renamed the `ClaimStrategy` interface to `CellClaimResolutionStrategy` and moved it, together with its six concrete implementations, into a new `src/simulation/claim/resolution/` subfolder (mirrored under `tests/simulation/claim/resolution/`). Purely a structural and naming refactor — no behavioural changes.

## Motivation
`ClaimStrategy` sat directly alongside `CellClaim`, `ClaimCandidate`, and `ClaimContext` in a single flat `claim/` folder, so the resolution policy (which player wins a contested cell) was not visually distinguishable from the resolution mechanism (`CellClaim`) or its supporting data types. The rename to `CellClaimResolutionStrategy` makes the interface's role explicit, and grouping it with its six implementations under `resolution/` isolates the swappable policy layer — the seam the project intends to build a configurable custom simulation model on — from the fixed per-cell resolution machinery that stays in `claim/`.

## Changes

### Files Deleted
- None (all moves preserved via `git mv`; no files were removed)

### Files Updated

- **`src/simulation/claim/resolution/CellClaimResolutionStrategy.ts`** *(renamed from `src/simulation/claim/ClaimStrategy.ts`)* — Interface renamed `ClaimStrategy` → `CellClaimResolutionStrategy`; imports of `ClaimCandidate`/`ClaimContext` updated to `../`.
- **`src/simulation/claim/resolution/FirstMatchClaimStrategy.ts`**, **`ContestedCellVoidStrategy.ts`**, **`IncumbentClaimStrategy.ts`**, **`NeighbourMajorityClaimStrategy.ts`**, **`RotatingPriorityClaimStrategy.ts`**, **`StrongestMatchClaimStrategy.ts`** *(all moved from `src/simulation/claim/`)* — `implements`/fallback field types updated to `CellClaimResolutionStrategy`; `ClaimCandidate`/`ClaimContext` imports updated to `../`; `NeighbourMajorityClaimStrategy.ts` additionally updated its `Grid`/`wrapCoordinate` imports to `../../`.
- **`src/simulation/claim/resolution/index.ts`** *(new file)* — Barrel exporting the six strategy classes and the `CellClaimResolutionStrategy` type from the new subfolder.
- **`src/simulation/claim/index.ts`** — Re-exports the six strategy classes and `CellClaimResolutionStrategy` from `./resolution` instead of declaring them directly; still exports `ClaimCandidate` and `ClaimContext` locally.
- **`src/simulation/claim/CellClaim.ts`** — Import path for `CellClaimResolutionStrategy` updated to `./resolution/CellClaimResolutionStrategy`.
- **`src/simulation/claim/ClaimContext.ts`** — JSDoc `{@link ClaimStrategy}` reference updated to `{@link CellClaimResolutionStrategy}`.
- **`src/simulation/claim/ClaimCandidate.ts`** — Removed a stray blank line introduced by an editor auto-format pass; no logic change.
- **`src/simulation/SimulationOptions.ts`** — Import paths for `CellClaimResolutionStrategy` and `FirstMatchClaimStrategy` updated to the `claim/resolution/` subfolder.
- **`src/simulation/level/Level.ts`**, **`src/simulation/level/CustomLevel.ts`** — Import paths for `CellClaimResolutionStrategy`/`FirstMatchClaimStrategy` updated to `../claim/resolution/`.
- **`src/simulation/mode/SimulationMode.ts`** — JSDoc reference already named `CellClaimResolutionStrategy`; no path involved, left as prose.
- **`src/simulation/index.ts`** — No functional change; still re-exports through the `./claim` barrel, which now sources from `./resolution` internally.
- **`src/gui/AvailableClaimStrategies.ts`** — No path change needed (consumes the top-level `../simulation` barrel), verified still resolves correctly.
- **`eslint.config.mjs`** — Added a fourth-level glob (`tests/*/*/*/*.ts`) to `allowDefaultProject` so ESLint's TypeScript project service picks up the new `tests/simulation/claim/resolution/*.test.ts` files.
- **`tests/simulation/claim/resolution/FirstMatchClaimStrategy.test.ts`**, **`ContestedCellVoidStrategy.test.ts`**, **`IncumbentClaimStrategy.test.ts`**, **`NeighbourMajorityClaimStrategy.test.ts`**, **`RotatingPriorityClaimStrategy.test.ts`**, **`StrongestMatchClaimStrategy.test.ts`** *(all moved from `tests/simulation/claim/`)* — Relative import depth increased by one level; `ClaimCandidate`/`ClaimContext`/`Cell`/`Grid` imports repointed to `../../../../src/...` and the strategy-under-test/fallback imports repointed to `../../../../src/simulation/claim/resolution/...`.
- **`tests/simulation/claim/CellClaim.test.ts`** — `CellClaimResolutionStrategy` import path updated to `../../../src/simulation/claim/resolution/CellClaimResolutionStrategy`.
- **`tests/simulation/Simulation.test.ts`** — Same import path update as above (two levels shallower path prefix).
- **`tests/integration/ClaimStrategyGame.test.ts`** — `CellClaimResolutionStrategy` type import updated (still via the `../../src/simulation` barrel, just the renamed type name).
- **`tests/simulation/mode/GlobalSimulationMode.test.ts`**, **`tests/simulation/mode/PlayerLocalSimulationMode.test.ts`** — `FirstMatchClaimStrategy` import path updated to `../../../src/simulation/claim/resolution/FirstMatchClaimStrategy`.
- **`tests/simulation/level/Level.test.ts`**, **`tests/simulation/level/CustomLevel.test.ts`** — `ContestedCellVoidStrategy`/`FirstMatchClaimStrategy` import paths updated to `../../../src/simulation/claim/resolution/`.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [x] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Test coverage improvement

## Implementation Plan

### Phase 1 — Rename `ClaimStrategy` to `CellClaimResolutionStrategy`

**Pre-condition**: The interface and its six implementations live flat in `src/simulation/claim/`, named `ClaimStrategy.ts` et al.

1. `git mv src/simulation/claim/ClaimStrategy.ts src/simulation/claim/CellClaimResolutionStrategy.ts` and rename the exported interface to `CellClaimResolutionStrategy`, since the file must compile under its new name before any consumer is repointed.
2. Update every `implements ClaimStrategy` / `ClaimStrategy` field type in `FirstMatchClaimStrategy.ts`, `ContestedCellVoidStrategy.ts`, `IncumbentClaimStrategy.ts`, `NeighbourMajorityClaimStrategy.ts`, `RotatingPriorityClaimStrategy.ts`, `StrongestMatchClaimStrategy.ts`, `CellClaim.ts`, `SimulationOptions.ts`, `Level.ts`, `CustomLevel.ts`, and `AvailableClaimStrategies.ts` to reference `CellClaimResolutionStrategy`, so no source file still imports the deleted `ClaimStrategy` symbol.
3. Update the matching test files (`CellClaim.test.ts`, `Simulation.test.ts`, each strategy's `.test.ts`, `ClaimStrategyGame.test.ts`) to import and reference `CellClaimResolutionStrategy`, so the test suite type-checks against the renamed interface.

**Post-condition**: `npm run lint`, `npm run test`, and `npm run build` all pass with the interface renamed everywhere; no reference to the old `ClaimStrategy` symbol remains in `src/` or `tests/`.

### Phase 2 — Move the strategy interface and implementations into `resolution/`

**Pre-condition**: Phase 1 is complete; every file compiles under the `CellClaimResolutionStrategy` name while still living in the flat `claim/` folder.

1. Create `src/simulation/claim/resolution/` and `git mv` `CellClaimResolutionStrategy.ts` plus the six strategy implementation files into it, since grouping the swappable resolution-policy classes together (separate from `CellClaim`, `ClaimCandidate`, `ClaimContext`) isolates the extensibility seam for a future configurable model.
2. Fix the relative imports inside each moved file: `ClaimCandidate`/`ClaimContext` go from `./` to `../` (one directory shallower than the new location), and `NeighbourMajorityClaimStrategy.ts`'s `Grid`/`wrapCoordinate` imports go from `../` to `../../`, since every moved file now sits one directory deeper.
3. Add `src/simulation/claim/resolution/index.ts` as a barrel re-exporting the six strategies and the `CellClaimResolutionStrategy` type, then update `src/simulation/claim/index.ts` to source those symbols from `./resolution` instead of declaring them directly, so external consumers (`src/simulation/index.ts`, `src/gui/AvailableClaimStrategies.ts`) keep working unchanged through the existing barrel chain.
4. Update the direct-path imports in `CellClaim.ts`, `SimulationOptions.ts`, `Level.ts`, and `CustomLevel.ts` to point at `claim/resolution/CellClaimResolutionStrategy` and `claim/resolution/FirstMatchClaimStrategy`, since these files import the concrete files rather than going through a barrel.
5. Mirror the move in tests: `git mv` the six strategy test files into `tests/simulation/claim/resolution/`, and fix their relative import depth (one level deeper for `ClaimCandidate`/`ClaimContext`/`Cell`/`Grid`, and repointed to `claim/resolution/` for the strategy-under-test and fallback classes), plus fix the remaining stale direct-path imports in `CellClaim.test.ts`, `Simulation.test.ts`, the two mode tests, and the two level tests.
6. Add a fourth glob level (`tests/*/*/*/*.ts`) to `allowDefaultProject` in `eslint.config.mjs`, since the new `tests/simulation/claim/resolution/` test files sit one directory deeper than the existing glob patterns covered.

**Post-condition**: `npm run lint`, `npm run test` (345 tests), `npm run typecheck`, and `npm run build` all pass with the strategy interface and its six implementations living under `src/simulation/claim/resolution/` (mirrored in `tests/`), and no file anywhere still imports a strategy class from its old flat `claim/` path.

**Dependencies**: Phase 2 depends on Phase 1 (the rename) being complete first, so the move only has to update paths, not names, in the same commit.

## Testing

### TypeScript unit tests

No test logic changed — this PR only moves files and updates import paths/type names. All six strategy test files (`FirstMatchClaimStrategy.test.ts`, `ContestedCellVoidStrategy.test.ts`, `IncumbentClaimStrategy.test.ts`, `NeighbourMajorityClaimStrategy.test.ts`, `RotatingPriorityClaimStrategy.test.ts`, `StrongestMatchClaimStrategy.test.ts`) were relocated to `tests/simulation/claim/resolution/` to mirror the new source layout, with only their import paths adjusted.

- [x] Unit tests added/updated (paths only; assertions unchanged)
- [ ] Integration tests added/updated (`ClaimStrategyGame.test.ts` import path unchanged in behavior, only the renamed type import)
- [x] All tests passing (`npm run test`)

**Test coverage**: Unchanged — same 345 tests as before the refactor, all still passing.

### Manual validation steps

| # | Check | How to verify |
|---|-------|---------------|
| 1 | No stray reference to the old `ClaimStrategy` name or its old flat file paths remains | `grep -rn "\bClaimStrategy\b"` and `grep -rn "claim/(CellClaimResolutionStrategy|FirstMatchClaimStrategy|...)"` across `src/` and `tests/` return no matches |
| 2 | Full validation pipeline passes after the move | `npm run lint`, `npm run test`, `npm run typecheck`, `npm run build` all exit clean |

## Documentation Plan

| File | Changes |
|------|---------|
| `README.md` | No changes required — the "Cell claim" section documents strategy class names and behaviour only, never file paths, so it stays accurate after the move. |

## Related Issues
Related to #24, #23

## Checklist
- [x] Code follows project conventions (static factory methods, TypeUtils validation, etc.)
- [x] TypeScript types are correct (`npm run typecheck` passes)
- [x] Code lints without errors (`npm run lint` passes)
- [x] All tests pass (`npm run test` passes — 345/345)
- [x] Build succeeds (`npm run build` passes)
- [ ] JSDoc comments added for public APIs (not applicable — no new public API surface, only moves/renames of existing documented members)
- [x] Updated documentation (if applicable) — confirmed no README changes needed
- [x] No breaking changes (or documented in PR description) — purely internal file layout and an internal type rename; no change to `src/simulation/index.ts`'s public barrel surface beyond the type name
- [ ] Commit messages follow Conventional Commits format (pending commit at PR-open time)

## Additional Notes
This is the first step toward generalizing the simulation's per-cell computation model so a player can configure a custom model when playing a game. Isolating the claim-resolution policy classes under `resolution/` gives that future work a clear, self-contained extensibility point to build on, separate from the fixed `CellClaim` resolution mechanism and the `ClaimCandidate`/`ClaimContext` data types it uses.
