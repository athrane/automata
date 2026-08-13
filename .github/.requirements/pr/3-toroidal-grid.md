## Summary

Makes the simulation grid toroidal in both axes: neighbour lookups that run past an edge now wrap to the opposite edge instead of being discarded. Every cell — including edge and corner cells — therefore has a full 8-neighbour Moore neighbourhood.

## Motivation

The grid is currently a bounded rectangle. `SumRule` skips any neighbour outside `[0, width) × [0, height)` and `GeometryRule` evaluates such positions as `false`, so a cell at `(0, y)` has no left neighbour at all. The practical consequence is that edge cells see only 5 neighbours and corner cells only 3, which permanently suppresses births along the border and makes patterns die or distort when they reach an edge. A wrap-around (toroidal) topology is the conventional choice for cellular automata precisely because it removes this boundary artefact and gives every cell identical rules.

## Changes

### Files Deleted

- None

### Files Updated

- **`src/simulation/WrapCoordinate.ts`** *(new file)* — Adds `wrapCoordinate(value: number, size: number): number`, which maps any coordinate into `[0, size)` using `((value % size) + size) % size` so negative coordinates wrap correctly (plain `%` in JavaScript returns a negative remainder). Throws `RangeError` when `size <= 0`.
- **`src/simulation/index.ts`** — Exports `wrapCoordinate` from the new module, matching the existing barrel-export convention for `src/simulation`.
- **`src/simulation/rule/SumRule.ts`** — Replaces the out-of-bounds `continue` in `matches()` with `wrapCoordinate` calls on both `nextX` and `nextY`, so every one of the 8 offsets now resolves to a real cell. Adds a `width === 0 || height === 0` guard clause that returns `this.sums.has(0)` for an empty grid, since `wrapCoordinate` rejects a zero extent. Class and method JSDoc updated to state the toroidal topology.
- **`src/simulation/rule/GeometryRule.ts`** — Replaces the inline bounds test in `matches()` with `wrapCoordinate` calls on `nx` and `ny`; `isPlayer` is now a plain `grid[ny][nx] === playerId` comparison. Adds a `width === 0 || height === 0` guard clause returning `!this.pattern.includes(true)` for an empty grid. Class and method JSDoc updated: the "Out-of-bounds positions are treated as `false`" sentence is replaced with the wrap-around description.
- **`tests/simulation/WrapCoordinate.test.ts`** *(new file)* — 6 unit tests for `wrapCoordinate`: in-range passthrough, negative wrap, `value === size` wrapping to 0, multi-grid overshoot in both directions, and the `size === 0` / `size < 0` `RangeError` guards.
- **`tests/simulation/rule/SumRule.test.ts`** — Replaces the `"ignores out-of-bounds neighbors"` test with a `"toroidal wrap-around"` describe block of 6 tests: left/right wrap across columns, top/bottom wrap across rows, a corner cell counting a full 8 neighbours, and the empty-grid guard. All other tests are unchanged; they operate on cell `(1,1)` of a 3×3 grid, whose neighbourhood is unaffected by wrapping.
- **`tests/simulation/rule/GeometryRule.test.ts`** — Replaces the `"treats out-of-bounds neighbours as false"` test with three tests: horizontal wrap (the `left` pattern slot of `(0,0)` reads `(2,0)`), vertical wrap (the `top` slot of `(0,0)` reads `(0,2)`), and an all-false pattern matching on an empty grid.
- **`tests/SumRule.test.ts`** — Updates its `"ignores out-of-bounds neighbors"` test to `"wraps neighbors around the grid edges"`, asserting horizontal and vertical wrap on a 3×3 grid. This file is a stale partial duplicate of `tests/simulation/rule/SumRule.test.ts` (see Additional Notes); it was updated rather than deleted to keep this PR scoped to the topology change.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [x] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [x] Test coverage improvement

Marked as breaking because the simulation now produces different generations for any grid whose activity reaches an edge. No public method signature changes.

## Implementation Plan

### Phase 1 — Introduce a shared coordinate-wrapping helper

**Pre-condition**: `SumRule.matches()` and `GeometryRule.matches()` each compute `width`/`height` from the grid and independently discard neighbours falling outside those bounds. No wrapping logic exists anywhere in `src/simulation`.

**Steps**:
1. Create `src/simulation/WrapCoordinate.ts` exporting `wrapCoordinate(value: number, size: number): number` implemented as `((value % size) + size) % size`. The double-modulo form is required because JavaScript's `%` returns `-1` for `-1 % 10`, which would index outside the grid.
2. In the same file, add a leading guard clause `if (size <= 0) throw new RangeError("size must be greater than 0");` — an empty grid has no valid coordinate to wrap into, so the failure is surfaced at the boundary rather than silently producing `NaN`.
3. Add `export { wrapCoordinate } from "./WrapCoordinate";` to `src/simulation/index.ts`, above the existing `SimulationOptions` export, matching the barrel-export style already used there.
4. Create `tests/simulation/WrapCoordinate.test.ts` with AAA-structured cases covering in-range passthrough, `-1 → size - 1`, `size → 0`, overshoot by more than one grid width in both directions, and both `RangeError` guard paths.

**Post-condition**: `wrapCoordinate` exists, is exported from `src/simulation`, and is covered by passing unit tests. No rule references it yet, so simulation behaviour is unchanged.

### Phase 2 — Wrap neighbour lookups in both rules

**Pre-condition**: Phase 1 is complete and `wrapCoordinate` is importable from `../WrapCoordinate`. Depends on Phase 1.

**Steps**:
1. In `src/simulation/rule/SumRule.ts`, add `import { wrapCoordinate } from "../WrapCoordinate";` between the `Grid` and `Rule` type imports, preserving the existing alphabetical-by-path import order.
2. In `SumRule.matches()`, insert `if (width === 0 || height === 0) return this.sums.has(0);` immediately after the `width` computation and before `let count = 0`. This preserves the previous zero-neighbour result for a degenerate grid and satisfies `wrapCoordinate`'s `size > 0` precondition.
3. In `SumRule.matches()`, delete the `if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) continue;` block and change the two coordinate assignments to `const nextX = wrapCoordinate(x + xOffset, width);` and `const nextY = wrapCoordinate(y + yOffset, height);`, so every offset contributes to the count.
4. In `src/simulation/rule/GeometryRule.ts`, add the same import, then insert `if (width === 0 || height === 0) return !this.pattern.includes(true);` after the `width` computation — an empty grid presents no populated neighbours, so only an all-`false` pattern can match.
5. In `GeometryRule.matches()`, change `nx`/`ny` to use `wrapCoordinate` and reduce `isPlayer` to `grid[ny][nx] === playerId`, dropping the four bounds comparisons that are now unreachable.
6. Update the class-level and `matches()` JSDoc in both files to state that the grid is toroidal and that coordinates wrap on both axes; in `GeometryRule` this replaces the now-false claim that out-of-bounds positions are treated as `false`.

**Post-condition**: Both rule implementations read wrapped neighbours, so a cell at `(0, y)` reads `(width - 1, y)` as its left neighbour and a cell at `(x, 0)` reads `(x, height - 1)` as its top neighbour. `Simulation.run()` needs no change — it delegates all neighbour access to `Rule.matches`.

### Phase 3 — Realign the test suite with the new topology

**Pre-condition**: Phase 2 is complete. The three tests that assert bounded-grid edge behaviour now contradict the implementation. Depends on Phase 2.

**Steps**:
1. In `tests/simulation/rule/SumRule.test.ts`, remove the `"ignores out-of-bounds neighbors"` test and add a `"toroidal wrap-around"` describe block with six cases: left wrap from column 0, right wrap from the last column, top wrap from row 0, bottom wrap from the last row, a corner cell reporting a count of 8, and an empty grid reporting a count of 0. All fixtures use a 3×3 grid so the three wrapped offsets per axis resolve to distinct cells.
2. In `tests/simulation/rule/GeometryRule.test.ts`, remove the `"treats out-of-bounds neighbours as false"` test and add horizontal-wrap, vertical-wrap, and empty-grid cases, indexing the pattern array by the documented `NEIGHBOR_OFFSETS` order (`left` = index 3, `top` = index 1).
3. In `tests/SumRule.test.ts`, rewrite its `"ignores out-of-bounds neighbors"` test as `"wraps neighbors around the grid edges"` with the same 3×3 horizontal and vertical fixtures.
4. Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` and confirm all four succeed.

**Post-condition**: No test asserts bounded-grid edge behaviour; wrapping is covered on both axes for both rule types and for the shared helper. The full suite passes.

## Testing

### TypeScript unit tests

- **`tests/simulation/WrapCoordinate.test.ts`** *(new)* — 6 tests over `wrapCoordinate`. Status: **passing**.
- **`tests/simulation/rule/SumRule.test.ts`** *(updated)* — 1 test removed, 6 added under `"toroidal wrap-around"`. Status: **passing**.
- **`tests/simulation/rule/GeometryRule.test.ts`** *(updated)* — 1 test removed, 3 added. Status: **passing**.
- **`tests/SumRule.test.ts`** *(updated)* — 1 test rewritten. Status: **passing**.
- **`Simulation` itself needed no test changes.** `Simulation.run()` delegates every neighbour read to `Rule.matches`, and the existing `Simulation` tests do not assert edge-specific outcomes.

- [x] Unit tests added/updated
- [ ] Integration tests added/updated — not applicable; the project has no integration test layer.
- [x] All tests passing (`npm run test` — 91/91 across 10 files)

**Test coverage**: New coverage for `wrapCoordinate` (6 cases) and for wrap-around behaviour on both axes in `SumRule` (6 cases) and `GeometryRule` (2 cases), plus empty-grid guard coverage for both rules. Net +14 tests.

### Manual validation steps

| # | Check | How to verify |
|---|-------|---------------|
| 1 | A pattern leaving one edge re-enters on the opposite edge | `npm run dev`, start a game, and watch activity that reaches the right-hand border reappear on the left-hand border in the following generation. |
| 2 | Border cells are no longer sparse | Observe several generations and confirm the density near the four edges matches the interior — previously the border thinned out because edge cells could reach at most 5 neighbours. |
| 3 | Corners wrap on both axes at once | Watch the four corners; a cell at a corner now sees the diagonally opposite corner as its diagonal neighbour, so corner activity persists instead of dying. |
| 4 | Simulation still terminates normally | Let a game run to completion and confirm the game-over callback still fires when the grid dies out, i.e. `hasLivingCells()` still reaches `false`. |
| 5 | No performance regression | Confirm the animation loop still runs smoothly; the change removes four comparisons per neighbour and adds two modulo operations. |

### Command output

- `npm run lint` — passed, no errors.
- `npm run typecheck` — passed, no errors.
- `npm run test` — passed, 91/91 tests across 10 files (575 ms).
- `npm run build` — passed, `vite build` completed in 191 ms.

## Documentation Plan

| File | Changes |
|------|---------|
| `README.md` | No changes required — the README documents the GUI/controller API and does not describe the grid's boundary behaviour or neighbourhood topology. |

## Related Issues

Closes #14

## Checklist
- [x] Code follows project conventions (no `any`, explicit types, ES module syntax, leading guard clauses, filename matches the exported symbol)
- [x] TypeScript types are correct (`npm run typecheck` passes)
- [x] Code lints without errors (`npm run lint` passes)
- [x] All tests pass (`npm run test` passes — 91/91)
- [x] Build succeeds (`npm run build` passes)
- [x] JSDoc comments added for `wrapCoordinate` and updated on both rule classes and their `matches()` methods
- [ ] Updated documentation (if applicable) — not applicable, see Documentation Plan
- [ ] No breaking changes — **behaviourally breaking**: generations now differ for any grid with activity at an edge. No API signature changes; documented in this description.
- [ ] Commit messages follow Conventional Commits format — nothing committed yet

## Additional Notes

- **Implemented, not committed.** The changes are in the working tree on `main` and validated; no branch, commit, push, or `gh pr create` has been run.
- **The working tree also contains unrelated changes.** `src/gui/*`, `src/state/StateMachine.ts`, `src/simulation/Simulation.ts`, `tests/simulation/Simulation.test.ts`, `tests/state/StateMachine.test.ts`, and `README.md` carry the in-progress work described in `.github/.requirements/pr/13-in-game-speed-and-score-overlays.md`. Those files are **not** part of this PR and are excluded from the Changes section above. This PR must be branched and staged selectively — the files listed under "Files Updated" only.
- **Degenerate small grids.** On a grid narrower than 3 columns (or shorter than 3 rows), the `-1` and `+1` offsets wrap to the same cell, so that cell is counted twice by `SumRule`. This is inherent to a torus of extent 2 and not specific to this implementation; production grids are far larger, and no test relies on a 1- or 2-wide grid.
- **Duplicate test files.** `tests/SumRule.test.ts` and `tests/Simulation.test.ts` sit at the `tests/` root and duplicate a subset of `tests/simulation/rule/SumRule.test.ts` and `tests/simulation/Simulation.test.ts`, which mirror the `src/` layout as the test standards require. `tests/SumRule.test.ts` was updated here because it would otherwise fail. Deleting both root-level duplicates is out of scope for this PR and worth a separate cleanup issue.
- **Tradeoff — shared helper vs. inline modulo.** The wrapping is extracted into `WrapCoordinate.ts` rather than inlined twice, so the negative-modulo correction is written and tested once. Cost is one extra module and two function calls per neighbour lookup.

**Suggested PR title**: `feat(simulation): Wrap the grid horizontally and vertically into a torus`
