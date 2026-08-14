## Summary

Changes the default `SimulationSpeed` level so a new game starts at the slowest speed (16 frames per generation) instead of the fastest, giving players a moment to observe the opening pattern before speeding up.

## Motivation

`GamePlayingScreen` constructs a fresh `SimulationSpeed` at the start of every game, and that model defaulted to the fastest level (one generation per animation frame). The grid was therefore already moving at full speed the instant a game began, leaving no time to see the level's deterministic starting pattern before it evolved. Starting at the slowest level gives the player that moment and leaves "Speed up" as the way to ramp toward the pace used today.

## Changes

### Files Deleted

- None

### Files Updated

- **`src/gui/SimulationSpeed.ts`** — Changes `DEFAULT_LEVEL_INDEX` from `SPEED_LEVELS.length - 1` (fastest) to `0` (slowest), and updates the two JSDoc comments describing the starting level and `create()` to match.
- **`tests/gui/SimulationSpeed.test.ts`** — Rewrites the six tests to assert the new default: the "starts at" case now expects level 1, `isAtMinimum() === true`, and 16 frames per generation; the clamp, round-trip, and frames-per-level cases are inverted to step up from the slowest level toward the fastest instead of down from the fastest toward the slowest.

## Type of Change
- [x] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [x] Test coverage improvement

## Implementation Plan

### Phase 1 — Flip the default speed level

**Pre-condition**: `SimulationSpeed.create()` starts every instance at `DEFAULT_LEVEL_INDEX = SPEED_LEVELS.length - 1`, the fastest level, so a new game runs at one generation per frame from the first frame.

**Steps**:
1. In `src/gui/SimulationSpeed.ts`, change `const DEFAULT_LEVEL_INDEX = SPEED_LEVELS.length - 1;` to `const DEFAULT_LEVEL_INDEX = 0;`, since index `0` is the slowest entry in `SPEED_LEVELS`.
2. In the same file, update the JSDoc comment above `DEFAULT_LEVEL_INDEX` from "the fastest level" to "the slowest level", and the JSDoc above `SimulationSpeed.create()` from "Creates a {@link SimulationSpeed} at the fastest level." to "...at the slowest level.", so the documentation matches the new behaviour.
3. No other production file reads `DEFAULT_LEVEL_INDEX` directly — `GamePlayingScreen` only calls `SimulationSpeed.create()` and `SimulationRenderer.setFramesPerGeneration(speed.getFramesPerGeneration())`, so both pick up the new default without further changes.

**Post-condition**: `SimulationSpeed.create()` returns an instance at level 1 of 5 (16 frames per generation), `isAtMinimum()` is `true`, and `isAtMaximum()` is `false`.

### Phase 2 — Update the unit tests to match

**Pre-condition**: Phase 1 is complete; `tests/gui/SimulationSpeed.test.ts` still asserts the old fastest-level default and steps `slowDown()` from a maximum starting point, so the suite fails against the new default without changes. Depends on Phase 1.

**Steps**:
1. In `tests/gui/SimulationSpeed.test.ts`, rename and rewrite `'starts at the fastest level'` to `'starts at the slowest level'`, asserting `getLevel() === 1`, `isAtMinimum() === true`, `isAtMaximum() === false`, and `getFramesPerGeneration() === 16`.
2. Swap the pair of clamp tests so `'does not fall below the slowest level'` calls `slowDown()` once from a fresh instance and asserts level 1, and `'does not exceed the fastest level'` steps up through the table with `speedUp()` before asserting the clamp at the top.
3. Rewrite `'reaches the slowest level after stepping down through the table'` as `'reaches the fastest level after stepping up through the table'`, replacing the `slowDown()` loop with `speedUp()` and asserting `getLevel() === getLevelCount()` / `isAtMaximum() === true`.
4. Rewrite `'holds a generation for more frames at slower levels'` as `'holds a generation for fewer frames at faster levels'`, replacing the `slowDown()` loop with `speedUp()` and inverting the expected array to `[16, 8, 4, 2, 1]`.
5. Rewrite `'returns to the fastest level after stepping down and back up'` as `'returns to the slowest level after stepping up and back down'`, calling `speedUp()` twice then `slowDown()` twice, and asserting a return to level 1 at 16 frames per generation.

**Post-condition**: All six tests in `tests/gui/SimulationSpeed.test.ts` pass against the new default, and the suite still covers both clamp boundaries, the full step range, and the frames-per-generation mapping.

## Testing

### TypeScript unit tests

- **`tests/gui/SimulationSpeed.test.ts`** *(updated)* — All 6 existing tests rewritten in place (no count change) to assert the slowest-first default: starting level, both clamp directions, the full step range, and the frames-per-generation mapping `[16, 8, 4, 2, 1]`. Status: **passing**.

- [x] Unit tests added/updated
- [ ] Integration tests added/updated — not applicable; no other test targets this behaviour
- [x] All tests passing (`npm run test`)

**Test coverage**: No new tests; the existing 6-test file was inverted to match the new default with the same boundary and round-trip coverage as before.

### Manual validation steps

| # | Check | How to verify |
|---|-------|---------------|
| 1 | New game starts at the slowest speed | `npm run dev`; start a game and confirm the control bar reads `Speed: 1/5` and the grid visibly holds each generation for 16 frames before advancing. |
| 2 | "Speed up" still reaches the fastest level | From a fresh game, click "Speed up" four times and confirm the readout reaches `Speed: 5/5`, the button disables, and the grid advances every frame. |
| 3 | "Slow down" is disabled at game start | Immediately after starting a game, confirm the "Slow down" button is disabled since the game is already at the slowest level. |

## Documentation Plan

_Omit this section if no documentation changes are required._

No changes required — the README's "In-game controls" section describes the five speed levels and the control bar generically, without stating which level a game starts at.

## Related Issues

Closes #18

## Checklist
- [x] Code follows project conventions (static factory methods, private constructors, no `any`, explicit types, guard clauses)
- [x] TypeScript types are correct (`npm run typecheck` passes)
- [x] Code lints without errors (`npm run lint` passes)
- [x] All tests pass (`npm run test` passes — 153/153)
- [x] Build succeeds (`npm run build` passes)
- [x] JSDoc comments added for public APIs — updated in place for the two comments describing the starting level
- [x] Updated documentation — none required, see Documentation Plan
- [x] No breaking changes — `SimulationSpeed`'s public API and signatures are unchanged; only the starting index and its default state differ
- [ ] Commit messages follow Conventional Commits format — nothing committed yet

## Additional Notes

- **Implemented, not committed.** The change is in the working tree on `main`; no branch, commit, push, or `gh pr create` has been run.
- **Scope check.** `DEFAULT_LEVEL_INDEX` is private to `src/gui/SimulationSpeed.ts` and read only by its own constructor, so this is a one-file behavioural change plus its test file — no other production code references the starting index directly.

**Suggested PR title**: `fix(gui): start the game at the slowest speed`
