## Summary

Fixes a bug where `Simulation.run()` required a player's cell to satisfy every selected rule simultaneously (AND) instead of any one of them (OR), which caused the grid to die out almost immediately after a new game started. Player rules are now combined with `Array.prototype.some`, so each selected preset independently grants a cell.

## Motivation

When a player selects several rule presets on the configuration screen (e.g. "Born at 3" and "Survive 2-3"), `Simulation.run()` required **every** one of those rules to match the same cell in the same generation. Because a "born" rule (neighbor count with the cell itself excluded) and a "survive" rule (neighbor count with the cell itself included) can rarely both be satisfied by the same cell at once, almost no cell could ever be populated. The seeded grid collapsed to empty within the first generation or two — well under the 5-generation grace period in `SimulationRenderer` — so every new game appeared to end immediately after it started.

## Changes

### Files Deleted

- None

### Files Updated

- **`src/simulation/Simulation.ts`** — Changed `player.rules.every(...)` to `player.rules.some(...)` in `run()` so a cell is populated when any one of a player's selected rules matches, rather than requiring all of them; updated the JSDoc above `run()` to document the OR semantics and explain why AND was unsafe.
- **`tests/simulation/Simulation.test.ts`** — Added a regression test asserting that two mutually-exclusive rules (`SumRule([1])` and `SumRule([4])`, which can never both match the same cell) still populate a cell when only one of them matches, proving the rules are combined with OR.

## Type of Change
- [x] Bug fix (non-breaking change which fixes an issue)

## Implementation Plan

### Phase 1 — Diagnose the rule-combination bug

**Pre-condition**: A new game ends (game-over overlay) almost immediately after starting, once three rule presets are selected on the configuration screen.

**Steps**:
1. Trace `GamePlayingScreen.show()` in `src/gui/screens/GamePlayingScreen.ts` to confirm `player.rules` is populated as the full array of selected `RulePreset.rule` instances (one `SumRule` per checked preset).
2. Inspect `Simulation.run()` in `src/simulation/Simulation.ts` and locate `player.rules.every((rule) => rule.matches(...))`, which requires all selected rules to match the same cell in the same generation.
3. Inspect `SumRule.matches()` in `src/simulation/rule/SumRule.ts` and confirm that a "born" rule (`includeSelf = false`) and a "survive" rule (`includeSelf = true`) only jointly match under narrow, coincidental conditions, making the AND combination almost always false across a 100×100 grid.

**Post-condition**: Root cause identified as `Array.prototype.every` combining independent birth/survival rules, instead of `Array.prototype.some`.

### Phase 2 — Fix rule combination and add regression coverage

**Pre-condition**: Phase 1 is complete; root cause confirmed.

**Steps**:
1. In `src/simulation/Simulation.ts`, replace `player.rules.every(...)` with `player.rules.some(...)` inside `run()` so any single matching rule grants the cell to that player.
2. Update the JSDoc comment above `run()` to state that a player's rules are combined with OR, and explain briefly why AND would starve the grid.
3. Add a test to `tests/simulation/Simulation.test.ts` using two mutually-exclusive `SumRule` instances (`[1]` and `[4]`) on the same player, seeded so only one of them matches, to prove the cell is still populated.

**Post-condition**: `npm run test` passes with the new regression test; selecting multiple rule presets in-game no longer causes the grid to collapse to empty within the first couple of generations.

## Testing

### TypeScript unit tests

- **`tests/simulation/Simulation.test.ts`** *(updated)* — Added 1 new test: `"combines a player's multiple rules with OR, not AND"`. Status: passing.
- All 6 pre-existing tests in this file, and all other test files, continue to pass unchanged.

- [x] Unit tests added/updated
- [ ] Integration tests added/updated — not applicable; the GUI/screen layer has no existing test coverage to extend.
- [x] All tests passing (`npm run test` — 60/60, 7 files)

**Test coverage**: The new test uses two `SumRule` instances whose match conditions are mutually exclusive for a given cell (a neighbor count cannot be both `1` and `4` simultaneously). It seeds the grid so only one rule matches, then asserts the cell is still populated next generation — this assertion fails under the old `.every()` implementation and passes under the new `.some()` implementation, directly proving the fix.

### Manual validation steps

| # | Check | How to verify |
|---|-------|----------------|
| 1 | New game no longer ends instantly with multiple rule presets | `npm run dev`; start a game selecting 3 rule presets that mix "Born" and "Survive" style rules (e.g. "Born at 3" + "Survive 2-3" + "Born at 1–2"); confirm the grid keeps evolving past generation 5 instead of the Game Over screen appearing almost immediately. |
| 2 | Single-rule and multi-player behavior unaffected | `npm run test`; confirm the pre-existing `Simulation.test.ts` cases (single-rule matching, multi-player rulesets) still pass unchanged. |

### Command output

- `npm run typecheck` — passed, no errors.
- `npm run lint` — passed, no errors.
- `npm run test` — passed, 60/60 tests across 7 files.
- `npm run build` — passed, `vite build` completed in 444ms.

## Documentation Plan

| File | Changes |
|------|---------|
| `README.md` | No changes required — this is an internal simulation-logic fix with no public API or usage change. |

## Related Issues

None filed. The bug was found and diagnosed during interactive review of the game-configuration → gameplay flow; no tracking issue exists yet.

## Checklist
- [x] Code follows project conventions (minimal, targeted change; no new abstractions introduced)
- [x] TypeScript types are correct (`npm run typecheck` passes)
- [x] Code lints without errors (`npm run lint` passes)
- [x] All tests pass (`npm run test` passes — 60/60)
- [x] Build succeeds (`npm run build` passes)
- [x] JSDoc comments added/updated for the changed public API (`Simulation.run()`)
- [ ] Updated documentation (if applicable) — not applicable, see Documentation Plan
- [x] No breaking changes (no public signatures changed; only internal match-combination logic)
- [ ] Commit messages follow Conventional Commits format — not yet committed; this PR description was generated and saved ahead of committing, per explicit request

## Additional Notes

The working tree currently also contains a large, separate, uncommitted change (the game-state-machine/GUI feature under `src/state/`, `src/gui/screens/`, etc. — see `.github/.requirements/pr/6-game-state-machine.md`) that has not yet been committed or pushed. This bug only manifests inside that not-yet-shipped feature, since `Simulation.ts` on `main` has no multi-rule players. This PR description covers only the rule-combination fix itself (`Simulation.ts` + its test); no `git` commands (branch, commit, push, or `gh pr create`) were run, so the fix has not yet been committed. Commit and push it — together with or after the state-machine feature, as you prefer — before opening a live PR on GitHub.
