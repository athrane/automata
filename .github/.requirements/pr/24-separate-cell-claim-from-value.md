# feat(simulation): separate cell claim from cell value in player local mode

## Summary

Splits a grid cell's persistent **claim** (`ownerId`) from its per-generation computed **value**, and changes player local simulation so a claimed cell keeps its owner forever once claimed — only its value can go null — instead of losing ownership the instant its rules stop matching. A claimed cell with a null value renders in its owner's colour toned down to 25%, distinguishing dormant territory from live cells.

**Status: planned — not implemented.** This document is the design output of a `grill-me` interview held before any code was written; the working tree is clean and no phase below has been built. Every validation line in Testing therefore reads *not run*.

## Motivation

Verified against the current code: in player local simulation (#23), `PlayerLocalSimulationMode.nextGeneration` buckets a player's cells by scanning the grid for its id, evaluates each through `CellClaim.resolve`, and writes the result straight into the next grid ([PlayerLocalSimulationMode.ts:56-84](src/simulation/mode/PlayerLocalSimulationMode.ts#L56-L84)). Because `Cell` is just `number | null` ([Cell.ts:2](src/simulation/Cell.ts#L2)), "owner" and "current value" are the same field — when a claimed cell's rules stop matching and `CellClaim.resolve` returns `null` ([CellClaim.ts:94-96](src/simulation/claim/CellClaim.ts#L94-L96)), the cell is written as `null` and the claim is gone in the same step (confirmed by the existing test at [PlayerLocalSimulationMode.test.ts:82-93](tests/simulation/mode/PlayerLocalSimulationMode.test.ts#L82-L93)).

That conflation blocks the requested rule: a player should keep a cell it once claimed even through generations where the computed value is null, so the territory can later come back to life under that same player's rules, and the player can see at a glance which of its cells are live versus dormant. Today there is no data to represent "claimed but currently empty," and no rendering path for it — `SimulationRenderer.render()` sets one flat, opaque colour per player id with no opacity/blend mechanism ([SimulationRenderer.ts:135-149](src/gui/SimulationRenderer.ts#L135-L149)).

## Changes

### Files Deleted

- None

### Files Updated

**Cell / grid model**

- **`src/simulation/Cell.ts`** — Replace `type Cell = number | null` with `interface Cell { readonly ownerId: number | null; readonly value: number | null }`. `ownerId` is the persistent claim; `value` is the result computed for the current generation.
- **`src/simulation/Grid.ts`** — No shape change (`type Grid = Cell[][]`); doc comment updated for the composite `Cell`.

**Simulation core**

- **`src/simulation/Simulation.ts`** — The empty-grid fill in the constructor, `setCell`, `seedRandom` and `applyStartingPattern` build `{ ownerId: id, value: id }` from a raw player id (a freshly placed cell is claimed and alive at once); `hasLivingCells` and `getCellCounts` read `cell.value`, so score and game-over stay tied to live cells, not dormant claims.
- **`src/simulation/mode/GlobalSimulationMode.ts`** — Per-cell write becomes `{ ownerId: result, value: result }` from `cellClaim.resolve(...)`'s id-or-null result, keeping `ownerId` and `value` identical every generation. This mode does not adopt claim persistence in this PR (Decision 2 below); behaviour is unchanged.
- **`src/simulation/mode/PlayerLocalSimulationMode.ts`** — Core behavioural change. `bucketCellsByOwner` buckets by `cell.ownerId` instead of the cell's raw value, so a claimed cell whose value has gone null is still bucketed under its owner and evaluated the next generation. `evaluatedCells`'s "already in the bucket" check reads `.ownerId`. `nextGeneration` writes `{ ownerId: player.id, value: resolvedValue }` for every cell in a player's evaluated set: `ownerId` is always the evaluating player regardless of the result (point 5 of the request), `value` is exactly what `cellClaim.resolve` returned (points 6–7).

**Claim resolution**

- **`src/simulation/claim/CellClaim.ts`** — `resolve` narrows its return type from `Cell` to `number | null`: it decides the next *value*, not the composite cell — the mode decides `ownerId`. Builds `ClaimContext.owner` from `grid[y][x].ownerId`.
- **`src/simulation/claim/ClaimContext.ts`** — `owner` field retyped `number | null`.
- **`src/simulation/claim/ClaimStrategy.ts`** — `selectWinner` return type narrows from `Cell` to `number | null`.
- **`src/simulation/claim/FirstMatchClaimStrategy.ts`, `IncumbentClaimStrategy.ts`, `RotatingPriorityClaimStrategy.ts`, `StrongestMatchClaimStrategy.ts`, `ContestedCellVoidStrategy.ts`** — Return type updated to `number | null`; no logic changes, since none of these read `grid[y][x]` directly.
- **`src/simulation/claim/NeighbourMajorityClaimStrategy.ts`** — `countNeighbours`'s comparison becomes `grid[neighbourY][neighbourX].ownerId === playerId`: neighbourhood support is about territorial ownership, not a neighbour's current liveness.

**Rules**

- **`src/simulation/rule/SumRule.ts`, `src/simulation/rule/GeometryRule.ts`** — Neighbour comparisons become `grid[nextY][nextX].value === playerId` (Decision 3 below: count by value only), so a dormant claimed neighbour does not count toward a survive/birth match, matching Game-of-Life-style adjacency.

**Starting patterns / seeding**

- **`src/simulation/level/StartingPattern.ts`** — `cellAt` return type narrows from `Cell` to `number | null`; it names the owner a pattern places at generation 0, and `Simulation.applyStartingPattern` turns that id into a full `{ ownerId, value }` cell.
- **`src/simulation/level/CheckerStartingPattern.ts`, `src/simulation/level/RectanglesStartingPattern.ts`** — `sequence`/`cellAt` retyped `number | null` instead of `Cell`.
- **`src/simulation/level/RectangleRegion.ts`** — `owner` field retyped `number | null`.

**Rendering**

- **`src/gui/SimulationRenderer.ts`** — `render()`'s primary colour lookup reads `cell.value` (Phase 1, behaviour-preserving). Phase 3 adds a `tonedPlayerColors` map built once in `initThree()` by blending each `options.playerColors` entry 25% toward `DEFAULT_CELL_COLOR` via `THREE.Color.lerpColors`; `render()` falls back to it when `cell.value === null && cell.ownerId !== null`.

**Tests**

- **`tests/simulation/mode/PlayerLocalSimulationMode.test.ts`** *(updated)* — The existing "clears an owned cell its player's rules no longer match" case now asserts `nextGrid[1][1]` equals `{ ownerId: <player>, value: null }` instead of `null`. New cases: a dormant claimed cell (`ownerId` set, `value: null`) is still evaluated the following generation and can revive; an unclaimed cell (`ownerId: null`) is never entered into a player's evaluated set even when adjacent to that player's territory.
- **`tests/simulation/mode/GlobalSimulationMode.test.ts`** *(updated)* — Asserts `ownerId` and `value` stay identical on every written cell, preserving today's behaviour.
- **`tests/simulation/claim/CellClaim.test.ts`, `NeighbourMajorityClaimStrategy.test.ts`, `StrongestMatchClaimStrategy.test.ts`, `IncumbentClaimStrategy.test.ts`, `ContestedCellVoidStrategy.test.ts`** *(updated)* — Grid literals rebuilt as `{ ownerId, value }` cells; `NeighbourMajorityClaimStrategy.test.ts` gains a case where a neighbour is claimed but dormant to confirm it still counts as owned territory.
- **`tests/simulation/rule/SumRule.test.ts`, `tests/SumRule.test.ts`, `tests/simulation/rule/GeometryRule.test.ts`** *(updated)* — Grid literals rebuilt as `{ ownerId, value }` cells; new case confirms a dormant claimed neighbour (`value: null`) does not count toward a match.
- **`tests/simulation/Simulation.test.ts`, `tests/Simulation.test.ts`** *(updated)* — `setCell`, `seedRandom`, `applyStartingPattern`, `hasLivingCells`, `getCellCounts` re-asserted against the composite cell shape.
- **`tests/simulation/level/Level.test.ts`, `tests/simulation/player/FirstClaimedCellPositioning.test.ts`, `tests/simulation/player/RandomClaimedCellPositioning.test.ts`** *(updated)* — Grid literals rebuilt as `{ ownerId, value }` cells; behaviour unchanged.
- **`tests/integration/PlayerLocalGame.test.ts`** *(updated)* — Adds an assertion that a player's territory count in `getCellCounts` can recover after dipping, now that a dormant cell remains eligible to revive instead of being permanently lost.
- **`tests/integration/ClaimStrategyGame.test.ts`, `tests/integration/LevelOneGame.test.ts`** *(updated)* — Grid literal / cell-shape updates only; both exercise `GlobalSimulationMode`, whose behaviour is unchanged.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [x] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [x] Documentation update
- [ ] Refactoring (no functional changes)
- [x] Test coverage improvement

`Cell` changes from `number | null` to `{ ownerId, value }`, which is a breaking change to every public signature that read or returned a bare cell value (`StartingPattern.cellAt`, `ClaimStrategy.selectWinner`, `CellClaim.resolve`, `Simulation.setCell`). All are internal to this package with call sites updated in the same PR (the same shape of break taken for `GameConfiguration` in #23). Player local simulation's territory-decay behaviour changes: a cell whose rules stop matching now dims to 25% opacity and can later revive, instead of disappearing outright.

## Implementation Plan

### Phase 1 — Split Cell into `{ ownerId, value }` and migrate every direct consumer, preserving current behaviour exactly

**Pre-condition**: `Cell` is `number | null` everywhere; ownership and value are the same field in both simulation modes.

**Steps**:
1. In `src/simulation/Cell.ts`, replace the type alias with `export interface Cell { readonly ownerId: number | null; readonly value: number | null }`, documenting that a fresh claim always sets both fields to the same id.
2. In `src/simulation/Simulation.ts`, update the constructor's grid fill to `{ ownerId: null, value: null }`, `setCell(x, y, id: number | null)` to write `{ ownerId: id, value: id }`, `seedRandom` to write `{ ownerId: playerId, value: playerId }` per populated cell, and `applyStartingPattern` to write `{ ownerId: owner, value: owner }` from `pattern.cellAt(x, y)`. Change `hasLivingCells` to `row.some((cell) => cell.value !== null)` and `getCellCounts` to key its map from `cell.value`, so score and game-over continue to track live cells only, not dormant claims — no observable behaviour changes here since `ownerId === value` for every cell this phase produces.
3. In `src/simulation/mode/GlobalSimulationMode.ts`, change the per-cell write to `const result = context.cellClaim.resolve(...); nextGrid[y][x] = { ownerId: result, value: result };`, and the initial fill to `{ ownerId: null, value: null }`. `src/simulation/mode/PlayerLocalSimulationMode.ts` gets the same treatment for now — bucket by `cell.value` (as today) and write `{ ownerId: result, value: result }` — so this phase changes no behaviour in either mode; Phase 2 below is where `PlayerLocalSimulationMode` starts bucketing by `ownerId` instead.
4. In `src/simulation/claim/CellClaim.ts`, narrow `resolve`'s return type to `number | null` and build `ClaimContext.owner` from `grid[y][x].ownerId`. In `src/simulation/claim/ClaimContext.ts` and `ClaimStrategy.ts`, retype `owner` and `selectWinner`'s return to `number | null`. Update the five claim strategy implementations' return types to match, and change `NeighbourMajorityClaimStrategy.countNeighbours`'s comparison to `grid[neighbourY][neighbourX].ownerId === playerId`.
5. In `src/simulation/rule/SumRule.ts` and `GeometryRule.ts`, change the neighbour comparison from `grid[nextY][nextX] === playerId` to `grid[nextY][nextX].value === playerId` (Decision 3: neighbour counting reads value, not ownership, so a dormant claimed neighbour does not support a survive/birth match).
6. In `src/simulation/level/StartingPattern.ts`, `CheckerStartingPattern.ts`, `RectanglesStartingPattern.ts` and `RectangleRegion.ts`, retype `cellAt`/`sequence`/`owner` from `Cell` to `number | null` — a pattern still names a single id per cell; `Simulation.applyStartingPattern` is what expands it into the composite cell.
7. In `src/gui/SimulationRenderer.ts`, change `render()`'s colour lookup to key off `cell.value` instead of the bare cell, with no other change — rendering stays behaviour-identical.
8. Update every test file listed under Tests above whose grid or cell literals currently use bare `number | null` values, rebuilding them as `{ ownerId, value }` objects with `ownerId === value` throughout, since no behaviour changes in this phase.

**Post-condition**: The codebase compiles against the composite `Cell` type; every test in the existing suite passes unmodified in behaviour (only literal shapes changed); `ownerId` and `value` are identical on every cell either mode produces, matching today's game exactly.

### Phase 2 — Persist claim independently of value in PlayerLocalSimulationMode

**Pre-condition**: Phase 1 is complete. `PlayerLocalSimulationMode` still buckets and writes cells by `value`, so `ownerId` and `value` remain identical after every generation.

**Steps**:
1. In `src/simulation/mode/PlayerLocalSimulationMode.ts`, change `bucketCellsByOwner` to key off `cell.ownerId` instead of the cell itself, so a cell with `ownerId` set and `value: null` is still bucketed under its owner and included in that player's evaluated set the next generation.
2. Change `evaluatedCells`'s check for "the occupied cell is already in the bucket" from `context.grid[position.y][position.x] === player.id` to `context.grid[position.y][position.x].ownerId === player.id`.
3. Change `nextGeneration`'s per-cell write from `nextGrid[cell.y][cell.x] = context.cellClaim.resolve(...)` to `nextGrid[cell.y][cell.x] = { ownerId: player.id, value: context.cellClaim.resolve(...) }` — `ownerId` is fixed to the evaluating player regardless of the resolved value (point 5 of the request); `value` is exactly the resolved result, null or otherwise (points 6–7).
4. Update `tests/simulation/mode/PlayerLocalSimulationMode.test.ts`: the "clears an owned cell its player's rules no longer match" case now asserts `{ ownerId: <player>, value: null }` rather than `null`; add a case where a dormant claimed cell (from a prior generation) is evaluated again and revives (`value` becomes non-null) once its neighbourhood matches; add a case confirming an unclaimed cell (`ownerId: null`) is never pulled into a player's evaluated set by proximity alone.
5. Update `tests/integration/PlayerLocalGame.test.ts` to assert that `getCellCounts` for a player can recover after a dip, since a dormant cell is no longer permanently lost.

**Post-condition**: In player local simulation, a claimed cell keeps its `ownerId` across generations regardless of its computed `value`; `GlobalSimulationMode` is untouched and still keeps `ownerId === value` on every cell it writes.

**Dependencies**: Phase 1.

### Phase 3 — Render dormant claimed cells at 25% of the owner's colour

**Pre-condition**: Phase 2 is complete, so the grid can hold cells with `ownerId` set and `value: null`. `SimulationRenderer` has no toned-colour concept.

**Steps**:
1. In `src/gui/SimulationRenderer.ts`, add a `TONED_DOWN_BLEND = 0.25` constant and a `private readonly tonedPlayerColors: Map<number, number>` field, built once in `initThree()` by, for each entry of `options.playerColors`, computing `new THREE.Color(DEFAULT_CELL_COLOR).lerp(new THREE.Color(playerColor), TONED_DOWN_BLEND).getHex()` and storing it keyed by player id — matching the existing pattern of computing a colour once and reusing it, as `pulseBaseColor`/`pulsePeakColor` already do.
2. In `render()`, change the colour decision to: `cell.value !== null` → `playerColors.get(cell.value)`; else `cell.ownerId !== null` → `tonedPlayerColors.get(cell.ownerId)`; else `DEFAULT_CELL_COLOR`.
3. No test file changes: `SimulationRenderer` is untested by unit tests today (DOM/WebGL-bound, per #23), covered instead by the manual steps below.

**Post-condition**: A claimed cell whose value is currently null renders in its owner's colour at 25% strength instead of the empty-cell colour; a live claimed cell and an unclaimed cell render exactly as before.

**Dependencies**: Phase 2 (there is nothing to render toned-down before then).

## Testing

### TypeScript unit tests

All test work below is planned, not written. No test file in this PR exists yet.

- **`tests/simulation/mode/PlayerLocalSimulationMode.test.ts`** *(updated)* — Persistence, revival, and no-proximity-claim cases. Status: **not run — not implemented**.
- **`tests/simulation/mode/GlobalSimulationMode.test.ts`** *(updated)* — `ownerId`/`value` parity preserved. Status: **not run — not implemented**.
- **`tests/simulation/claim/CellClaim.test.ts`, `NeighbourMajorityClaimStrategy.test.ts`, `StrongestMatchClaimStrategy.test.ts`, `IncumbentClaimStrategy.test.ts`, `ContestedCellVoidStrategy.test.ts`** *(updated)* — Composite cell literals; dormant-neighbour ownership case. Status: **not run — not implemented**.
- **`tests/simulation/rule/SumRule.test.ts`, `tests/SumRule.test.ts`, `tests/simulation/rule/GeometryRule.test.ts`** *(updated)* — Composite cell literals; dormant neighbour excluded from adjacency count. Status: **not run — not implemented**.
- **`tests/simulation/Simulation.test.ts`, `tests/Simulation.test.ts`** *(updated)* — `setCell`, `seedRandom`, `applyStartingPattern`, `hasLivingCells`, `getCellCounts` against the composite cell. Status: **not run — not implemented**.
- **`tests/simulation/level/Level.test.ts`, `tests/simulation/player/FirstClaimedCellPositioning.test.ts`, `tests/simulation/player/RandomClaimedCellPositioning.test.ts`** *(updated)* — Composite cell literals only. Status: **not run — not implemented**.
- **`tests/integration/PlayerLocalGame.test.ts`** *(updated)* — Territory recovery after a dip. Status: **not run — not implemented**.
- **`tests/integration/ClaimStrategyGame.test.ts`, `tests/integration/LevelOneGame.test.ts`** *(updated)* — Composite cell literals only. Status: **not run — not implemented**.

- [ ] Unit tests added/updated — planned, not written
- [ ] Integration tests added/updated — planned, not written
- [ ] All tests passing (`npm run test`) — not run

**Test coverage**: current suite is 271 tests across 30 files as of #21/#23. This plan updates roughly 17 existing test files for the new cell shape and adds 3–4 new cases covering persistence, revival, and dormant-neighbour exclusion. No new test files are created; `SimulationRenderer` remains covered only by manual steps, matching its existing treatment.

### Validation evidence

| Command | Result |
|---------|--------|
| `npm run lint` | not run — no code changes yet |
| `npm run typecheck` | not run — no code changes yet |
| `npm run test` | not run — no code changes yet; baseline is 271/271 as of #21/#23 |
| `npm run build` | not run — no code changes yet |

### Manual validation steps

| # | Check | How to verify |
|---|-------|---------------|
| 1 | Global simulation is unchanged | `npm run dev`, play a game in "Global simulation" mode, and confirm the grid evolves exactly as before with no toned-down cells. |
| 2 | A claimed cell dims instead of disappearing | Start a player local game, let part of a player's territory die off, and confirm those cells turn to 25%-strength versions of that player's colour instead of the empty-cell colour. |
| 3 | A dormant cell can revive | Continue observing a dimmed cell and confirm it returns to full colour if its neighbourhood later matches that player's rules again. |
| 4 | An unclaimed cell never dims | Confirm cells that were never claimed by any player stay the empty-cell colour throughout. |
| 5 | Score tracks live cells only | Confirm the scoreboard count for a player does not include its dimmed (dormant) cells, only its full-colour ones. |
| 6 | No cross-player takeover occurs | Run a player local game for a minute and confirm no cell — dim or full colour — ever changes from one player's colour directly to another's. |

## Documentation Plan

| File | Changes |
|------|---------|
| `README.md` | Update the "Game modes" section (around line 80–83): replace "a cell only ever changes between its owner and empty" with a description of the three states a claimed cell can be in — full colour (live), dimmed to 25% (dormant, still owned), or the outcome only reachable before it is ever claimed (empty) — and note that a dormant cell can revive under its owner's rules without the player having to walk it back. |

## Related Issues
Closes #24

## Checklist
- [ ] Code follows project conventions (static factory methods, private constructors, `create` validation) — planned throughout, not yet written
- [ ] TypeScript types are correct (`npm run typecheck` passes) — not run
- [ ] Code lints without errors (`npm run lint` passes) — not run
- [ ] All tests pass (`npm run test` passes) — not run
- [ ] Build succeeds (`npm run build` passes) — not run
- [ ] JSDoc comments added for public APIs — planned for every retyped interface, class and public method
- [x] Updated documentation (if applicable) — `README.md` change specified in the Documentation Plan
- [x] No breaking changes (or documented in PR description) — the `Cell` shape change and its ripple through internal signatures is documented under Type of Change
- [ ] Commit messages follow Conventional Commits format — no commits yet

## Additional Notes

### Verification of the pre-existing behaviour named in the request

- **Point 2 (a claimed cell participates in the next generation's update) — confirmed.** `PlayerLocalSimulationMode.nextGeneration` re-evaluates every cell a player currently owns against that player's rules each generation ([PlayerLocalSimulationMode.ts:56-84](src/simulation/mode/PlayerLocalSimulationMode.ts#L56-L84)).
- **Point 3 (a null result unclaims the cell) — confirmed.** Because `Cell` is `number | null` today, `CellClaim.resolve` returning `null` is written straight into the grid, which is simultaneously the value and the claim ([CellClaim.ts:94-96](src/simulation/claim/CellClaim.ts#L94-L96); test at [PlayerLocalSimulationMode.test.ts:82-93](tests/simulation/mode/PlayerLocalSimulationMode.test.ts#L82-L93)).

### Design decisions taken in the `grill-me` interview

1. **Cell becomes `{ ownerId, value }`** rather than a parallel claim grid or a discriminated union — the simplest model giving every consumer one unambiguous place to read "who owns this" versus "what's the current state." *(recommended)*
2. **Scope: `PlayerLocalSimulationMode` only.** `GlobalSimulationMode` already lets a cell be contested and change hands across players every generation; the request's parenthetical "until another player claims it, but we will get back to that" is explicitly deferred, so `GlobalSimulationMode` keeps `ownerId === value` and is otherwise untouched. *(recommended)* **Risk**: the two modes diverge in territory-decay behaviour until a follow-up addresses contested reclaim.
3. **Rendering: opaque 25% blend toward the background colour**, precomputed per player in `SimulationRenderer.initThree()`, rather than a transparent-material/opacity approach — no change to the renderer's material or transparency setup. *(recommended)*
4. **Neighbour counting reads `value`, not `ownerId`.** `SumRule`/`GeometryRule` treat a dormant claimed cell as empty for adjacency purposes, matching Game-of-Life-style "only live cells influence births/deaths." `NeighbourMajorityClaimStrategy` (a `GlobalSimulationMode`-only concern) reads `ownerId` instead, since it measures territorial support, not liveness. *(recommended)*

### Open questions and follow-up work

- Contested reclaim ("until another player claims it") is deferred, per Decision 2 — the natural follow-up once this PR lands.
- Should `GlobalSimulationMode` eventually adopt claim persistence too, and if so, how does a null-value-but-claimed cell interact with a *different* player's rules matching it in that mode? This PR takes no position on that question.
- `getCellCounts`/scoring counts live (`value`-based) cells only; a player that holds substantial dormant (dimmed) territory but few live cells is not credited for it in score. Worth revisiting once contested reclaim exists, since dormant territory may then matter defensively.
