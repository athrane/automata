## Summary

Fixes the in-game scoreboard so each player's score is the sum of the living cells it owned at the end of every generation played so far, instead of being overwritten each refresh with only the current cell count. `Simulation` now tracks a cumulative per-player score alongside the existing live snapshot, and `GamePlayingScreen` reads the cumulative value for the scoreboard.

## Motivation

`GamePlayingScreen` polled `Simulation.getCellCounts()` every 200ms and passed the result straight into `ScoreBoardOverlay.update()`, which writes each value into a `<span>` via `textContent`. `getCellCounts()` recomputes a fresh snapshot of currently-living cells from the grid on every call, so each poll replaced the previous displayed value rather than adding to it — a player's score could go down as easily as up, and reflected only the current standing rather than performance accumulated across the game. The correct behaviour is for each completed generation's cell count to add to a running total, so a player's score only grows over the course of a game.

## Changes

### Files Deleted

- None

### Files Updated

- **`src/simulation/Simulation.ts`** — Adds a private field `scores: Map<number, number>`, initialised in the constructor to zero for every registered player. `run()` now adds each player's `getCellCounts()` result to `scores` after advancing the grid and generation counter, so the running total grows by exactly one generation's cell count per call. Adds a new public method `getScores(): ReadonlyMap<number, number>` that returns a defensive copy of the accumulated totals. `applyStartingPattern()` now resets every player's score to zero alongside the existing generation-counter reset, so starting a new level does not carry over the previous level's total. `getCellCounts()` itself is unchanged and keeps serving its existing callers (level tests, determinism checks) as a live snapshot.
- **`src/gui/screens/GamePlayingScreen.ts`** — The `setInterval` callback in `show()` now calls `this.scoreBoard.update(simulation.getScores())` instead of `this.scoreBoard.update(simulation.getCellCounts())`, so the scoreboard displays the cumulative total instead of the live snapshot. `ScoreBoardOverlay` itself needed no change — its `update(scores: ReadonlyMap<number, number>)` signature already matches `getScores()`'s return type.
- **`tests/simulation/Simulation.test.ts`** — Adds a `getScores` describe block (3 cases) and one new case in the existing `applyStartingPattern` describe block; see Testing below.

## Type of Change
- [x] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [x] Test coverage improvement

## Implementation Plan

### Phase 1 — Accumulate per-generation cell counts into a running score inside `Simulation`

**Pre-condition**: `Simulation` exposes only `getCellCounts()`, which recomputes a fresh snapshot of currently-living cells per player from `this.grid` on every call. Nothing in `Simulation` tracks a total across generations, and `applyStartingPattern()` only resets `this.generation`. Independent of Phase 2.

**Steps**:
1. In `src/simulation/Simulation.ts`, add a private field `private readonly scores: Map<number, number>` declared alongside `cellClaim`, initialised in the constructor via `this.scores = new Map(this.players.map((player) => [player.id, 0]));` so every registered player starts at zero.
2. In `Simulation.run()`, after `this.grid = nextGrid; this.generation += 1;`, add a loop `for (const [id, count] of this.getCellCounts()) { this.scores.set(id, (this.scores.get(id) ?? 0) + count); }`, so the newly resolved generation's cell counts are added to the running total rather than replacing it.
3. Add a new public method `getScores(): ReadonlyMap<number, number>` to `Simulation.ts`, placed directly after `getCellCounts()`, returning `new Map(this.scores)` so callers receive a copy and cannot mutate simulation-internal state.
4. In `Simulation.applyStartingPattern()`, after the existing `this.generation = 0;` line, add `for (const player of this.players) { this.scores.set(player.id, 0); }`, and update that method's JSDoc to state it also resets every player's score to zero.

**Post-condition**: `Simulation` tracks and exposes a cumulative per-player score via `getScores()`, separate from the existing live-snapshot `getCellCounts()`; both the generation counter and the scores reset together whenever a new starting pattern is applied.

### Phase 2 — Wire the scoreboard to cumulative scores and add regression coverage

**Pre-condition**: Phase 1 is complete — `Simulation.getScores()` exists and accumulates correctly. `GamePlayingScreen` polls `simulation.getCellCounts()` every `SCORE_REFRESH_INTERVAL_MS` (200ms) inside `show()` and passes the result straight into `ScoreBoardOverlay.update()`. Depends on Phase 1.

**Steps**:
1. In `src/gui/screens/GamePlayingScreen.ts`, change the `setInterval` callback in `show()` from `this.scoreBoard.update(simulation.getCellCounts());` to `this.scoreBoard.update(simulation.getScores());`.
2. In `tests/simulation/Simulation.test.ts`, add a new `describe("getScores", ...)` block with three cases: zero for every registered player before any generation runs; the running total after two successive `run()` calls equals the sum of `getCellCounts().get(1)` taken after each call; and a player with zero cells is still present in the result with a `0` score.
3. In `tests/simulation/Simulation.test.ts`, add one case to the existing `describe("applyStartingPattern", ...)` block asserting `getScores().get(1)` is `0` after a `run()` call followed by `applyStartingPattern()`.

**Post-condition**: The in-game scoreboard shows each player's score growing generation over generation instead of jumping around with the current cell count; `getCellCounts()` is unchanged and continues to serve its existing callers unmodified.

## Testing

### TypeScript unit tests

- **`tests/simulation/Simulation.test.ts`** *(updated)* — 4 new tests: a `getScores` block covering the zero-baseline case, the running-total-equals-sum-of-two-runs case, and the zero-cell-player-still-present case; plus one new case in `applyStartingPattern` asserting scores reset to zero alongside the generation counter. Status: **passing**.

- [x] Unit tests added/updated — 4 new tests
- [ ] Integration tests added/updated — not applicable; existing integration tests (`tests/integration/`) exercise `getCellCounts()` directly and are unaffected by this change
- [x] All tests passing (`npm run test` — 271/271, 30 files)

**Test coverage**: 267 → 271 tests. New coverage for `Simulation.getScores()` and the score-reset behaviour of `applyStartingPattern()`.

### Manual validation steps

| # | Check | How to verify |
|---|-------|---------------|
| 1 | Scores only increase over time | `npm run dev`, start a game, and watch the scoreboard for several seconds; confirm each player's number never decreases, even as that player's living cell count on the grid rises and falls. |
| 2 | A wiped-out player keeps its accumulated score | Let one player's population die out completely and confirm its scoreboard number stops changing but does not reset to `0` or disappear. |
| 3 | Starting a new game resets scores to zero | Play until game over (or exit), start a new game, and confirm every player's scoreboard entry begins at `0` again rather than continuing from the previous game's total. |

These manual steps were not run against a live browser in this environment — no headless-browser tooling (`chromium-cli`, Playwright, Puppeteer) is installed. The accumulation logic was instead verified by the new unit tests in `tests/simulation/Simulation.test.ts`, which assert the running total equals the sum of per-generation `getCellCounts()` snapshots and that it resets on `applyStartingPattern()`.

## Documentation Plan

_Omit this section if no documentation changes are required._

No changes required — `README.md` does not document `Simulation`'s per-player scoring methods (`getCellCounts`, and now `getScores`); its only per-class API table covers `SimulationRenderer`.

| File | Changes |
|------|---------|
| `README.md` | No changes required — `Simulation.getCellCounts` / `getScores` are internal APIs not covered by any README table. |

## Related Issues

Closes #21

## Checklist
- [x] Code follows project conventions (static factory methods, private constructors, no `any`, explicit types, guard clauses)
- [x] TypeScript types are correct (`npm run typecheck` passes)
- [x] Code lints without errors (`npm run lint` passes)
- [x] All tests pass (`npm run test` passes — 271/271)
- [x] Build succeeds (`npm run build` passes)
- [x] JSDoc comments added for public APIs — added for the new `getScores()` method; `applyStartingPattern`'s JSDoc updated for its changed behaviour
- [x] Updated documentation — none required, see Documentation Plan
- [x] No breaking changes — `getCellCounts()` keeps its existing signature and behaviour; `getScores()` and the `applyStartingPattern` score reset are additive
- [ ] Commit messages follow Conventional Commits format — nothing committed yet

## Additional Notes

- **Implemented, not committed.** The change is in the working tree on `main`; no branch, commit, push, or `gh pr create` has been run.
- **Issue #21 does not exist yet on GitHub** as of this draft (`gh issue view 21` returns "Could not resolve to an issue"). This file is numbered to follow the repository's convention of naming each PR draft after the issue it closes; create issue #21 before opening the PR, or renumber this file to match whichever issue is actually filed.
- **Why accumulate inside `Simulation.run()` rather than in `GamePlayingScreen`'s poll timer.** The polling interval (200ms) is decoupled from the generation rate, which varies from 1 to 16 frames per generation via `SimulationSpeed`. Summing `getCellCounts()` on the timer tick itself would either double-count a generation held on screen for multiple polls (slow speeds) or silently skip whole generations that complete between polls (fast speeds). Accumulating once per `run()` call ties the score to the actual generation cadence regardless of display speed or refresh interval.
- **`getCellCounts()` is unchanged and still needed.** It is exercised directly by `tests/integration/LevelOneGame.test.ts`, `tests/simulation/level/Level*.test.ts`, and the determinism check in PR #15's plan, none of which are about score accumulation — they check the live grid state. This PR adds `getScores()` alongside it rather than changing its behaviour.

**Suggested PR title**: `fix(simulation): Accumulate player score across generations instead of overwriting it`
