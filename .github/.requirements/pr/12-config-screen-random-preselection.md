## Summary

Changes two aspects of the game-configuration screen: the "Start game" button moves to the left of the "Reset" button, and three rule presets are now selected at random whenever the screen is shown. The screen therefore opens in a valid, immediately startable state instead of an empty selection.

## Motivation

The configuration screen opens with no rules selected and a disabled "Start game" button, so every player must tick three checkboxes before they can play — a mandatory chore that offers no meaningful choice to a first-time player who does not yet know what the presets do. In the button row, the primary action ("Start game") sits to the right of the secondary action ("Reset"), which is the reverse of the usual primary-first ordering and makes the destructive button the first target the eye and pointer reach.

## Changes

### Files Deleted

- None

### Files Updated

- **`src/gui/RandomRulePresetSelection.ts`** *(new file)* — Adds a pure, DOM-free helper `selectRandomPresetIndices(total: number, count: number, random: () => number): number[]` that returns `count` distinct indices in `[0, total)` using partial Fisher–Yates over an index array, with the random source injected so tests can supply a deterministic generator. Returns every index when `count >= total`, and an empty array when `count <= 0` or `total <= 0`.
- **`src/gui/index.ts`** — Exports `selectRandomPresetIndices` from the new module so it follows the existing barrel-export convention used by the rest of `src/gui`.
- **`src/gui/screens/GameConfigurationScreen.ts`** — In `show()`: (a) swaps the append order in `buttonRow` so `startButton` is appended before `resetButton`; (b) after the checkbox loop, seeds `this.selectedIndices` from `selectRandomPresetIndices(AVAILABLE_RULE_PRESETS.length, REQUIRED_RULE_COUNT, Math.random)`, checks the corresponding boxes, disables the unselected ones, and enables `startButton`; (c) updates the class JSDoc to state that three presets are preselected at random on every `show()`. `handleCheckboxChange` and `hide()` are unchanged; the existing "Reset" handler keeps clearing the selection to empty.
- **`tests/gui/RandomRulePresetSelection.test.ts`** *(new file)* — Unit tests for the helper covering count, distinctness, in-range indices, deterministic output under a stubbed random source, and the `count >= total` / `count <= 0` / `total <= 0` edge cases.
- **`eslint.config.mjs`** — Sets `maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 100` on `parserOptions.projectService`. Adding a ninth file under `tests/` exceeded typescript-eslint's default cap of 8 files resolved through the default project, which failed `npm run lint` with an error unrelated to the code change.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [x] Test coverage improvement

## Implementation Plan

### Phase 1 — Introduce a testable random preset selector

**Pre-condition**: `src/gui/screens/GameConfigurationScreen.ts` builds its checkbox list from `AVAILABLE_RULE_PRESETS` and starts with an empty `selectedIndices` set; no randomness exists in the GUI layer, and the Vitest environment is `node` (see `vite.config.ts`), so no DOM globals are available to tests.

**Steps**:
1. Create `src/gui/RandomRulePresetSelection.ts` exporting `selectRandomPresetIndices(total: number, count: number, random: () => number): number[]`, implemented as a partial Fisher–Yates shuffle over `[0 … total-1]` returning the first `count` entries. The random source is a parameter rather than a direct `Math.random()` call so the function is deterministic under test.
2. In the same file, add linear guard clauses at the top: return `[]` when `total <= 0` or `count <= 0`, and return all indices when `count >= total`. This keeps the caller free of boundary handling if `AVAILABLE_RULE_PRESETS` ever shrinks below `REQUIRED_RULE_COUNT`.
3. Add `export { selectRandomPresetIndices } from "./RandomRulePresetSelection";` to `src/gui/index.ts`, matching the barrel-export style already used for `AVAILABLE_RULE_PRESETS` and the screens.
4. Create `tests/gui/RandomRulePresetSelection.test.ts` with AAA-structured cases: returns exactly `count` indices; all indices are distinct and within `[0, total)`; produces the expected fixed indices when passed a stubbed `random` returning a scripted sequence; returns `[]` for `count = 0`; returns all indices for `count >= total`.

**Post-condition**: `selectRandomPresetIndices` exists, is exported from `src/gui`, is covered by passing unit tests, and is not yet referenced by any screen — the configuration screen behaves exactly as before.

### Phase 2 — Preselect three rules and reorder the button row

**Pre-condition**: Phase 1 is complete and `selectRandomPresetIndices` is available from `src/gui/RandomRulePresetSelection`. Depends on Phase 1.

**Steps**:
1. In `src/gui/screens/GameConfigurationScreen.ts`, import `selectRandomPresetIndices` from `../RandomRulePresetSelection`, placed with the existing value imports above the `import type { RulePreset }` line to preserve the current import ordering.
2. In `show()`, move `buttonRow.appendChild(startButton)` ahead of `buttonRow.appendChild(resetButton)` so the primary action renders on the left; the `startButton` variable is already declared before the checkbox loop, so no other reordering is needed.
3. In `show()`, immediately after the checkbox-construction loop and before `root.appendChild(ruleList)`, call `selectRandomPresetIndices(AVAILABLE_RULE_PRESETS.length, REQUIRED_RULE_COUNT, Math.random)`, add each returned index to `this.selectedIndices`, set `checked = true` on the matching entries of `checkboxes`, and set `disabled = true` on the remaining checkboxes — mirroring the limit-reached behavior already implemented in `handleCheckboxChange`.
4. In `show()`, change `startButton.disabled = true` to reflect the seeded selection (`startButton.disabled = this.selectedIndices.size !== REQUIRED_RULE_COUNT`) so the button is enabled on first render, while remaining correct if the preset catalogue ever holds fewer than `REQUIRED_RULE_COUNT` entries.
5. Update the class-level JSDoc on `GameConfigurationScreen` to state that `REQUIRED_RULE_COUNT` presets are preselected at random each time `show()` runs, and that "Reset" clears that preselection.

**Post-condition**: Opening the configuration screen shows three randomly checked presets with the other checkboxes disabled and an enabled "Start game" button positioned to the left of "Reset"; clicking "Reset" still clears all selections and disables "Start game", and unchecking a preselected rule still re-enables the remaining checkboxes.

## Testing

### TypeScript unit tests

- **`tests/gui/RandomRulePresetSelection.test.ts`** *(new)* — 6 tests covering `selectRandomPresetIndices`: correct count, distinct in-range indices, deterministic result under a stubbed random source, and the `count <= 0` / `total <= 0` / `count >= total` guard paths. Status: **passing**.
- **`GameConfigurationScreen` itself is not unit tested.** The Vitest environment is `node` (`vite.config.ts`), so `document` is unavailable and the screen's DOM construction cannot be exercised without adding a `jsdom` dependency and changing the test environment — out of scope for this change. Both DOM-level behaviors (button order, preselected checkboxes) are covered by the manual validation steps below; the non-trivial logic is deliberately extracted into the DOM-free helper so it can be tested.

- [x] Unit tests added/updated
- [ ] Integration tests added/updated — not applicable; no DOM test environment exists in this project.
- [x] All tests passing (`npm run test` — 66/66, 8 files)

**Test coverage**: New coverage for `selectRandomPresetIndices` (6 cases). No change in coverage for `GameConfigurationScreen`, which remains untested at the DOM level as it is today.

### Manual validation steps

| # | Check | How to verify |
|---|-------|---------------|
| 1 | "Start game" renders to the left of "Reset" | `npm run dev`; from the title screen open the configuration screen and confirm the button row reads "Start game" then "Reset", left to right. |
| 2 | Exactly three presets are checked on open | On the configuration screen, count the ticked checkboxes — exactly 3 — and confirm the remaining 5 are disabled. |
| 3 | The preselection is random | Reload the page (or return to the title screen and re-enter configuration) several times and confirm the ticked set differs across visits. |
| 4 | "Start game" is enabled immediately | Open the configuration screen and click "Start game" without touching any checkbox; the game starts with the three preselected rules. |
| 5 | "Reset" still clears the preselection | Click "Reset"; confirm all checkboxes clear and re-enable, and "Start game" becomes disabled until 3 rules are selected again. |
| 6 | Unchecking a preselected rule re-enables the others | Untick one preselected rule; confirm the previously disabled checkboxes become selectable and "Start game" is disabled until a third rule is chosen. |

### Command output

- `npm run lint` — passed, no errors (after the `eslint.config.mjs` cap increase described above).
- `npm run typecheck` — passed, no errors.
- `npm run test` — passed, 66/66 tests across 8 files.
- `npm run build` — passed, `vite build` completed in 183ms.

## Documentation Plan

| File | Changes |
|------|---------|
| `README.md` | No changes required — the README does not describe the configuration screen's button layout or its default rule selection. |

## Related Issues

Closes #12

## Checklist
- [x] Code follows project conventions (no `any`, explicit types, ES module syntax, guard clauses, filename matches the module)
- [x] TypeScript types are correct (`npm run typecheck` passes)
- [x] Code lints without errors (`npm run lint` passes)
- [x] All tests pass (`npm run test` passes — 66/66)
- [x] Build succeeds (`npm run build` passes)
- [x] JSDoc comments added for `selectRandomPresetIndices` and updated on the `GameConfigurationScreen` class doc
- [ ] Updated documentation (if applicable) — not applicable, see Documentation Plan
- [x] No breaking changes — no public signatures change; `GameConfigurationScreen.create`/`show`/`hide` keep their contracts
- [ ] Commit messages follow Conventional Commits format — nothing committed yet

## Additional Notes

- **Implemented, not committed.** The code changes are in the working tree on `main` and validated; no branch, commit, push, or `gh pr create` has been run.
- **Deviation from the plan.** Phase 2 step 3 said to disable every unselected checkbox. The implementation gates that on `this.selectedIndices.size >= REQUIRED_RULE_COUNT` (mirroring `handleCheckboxChange`) so a preset catalogue smaller than `REQUIRED_RULE_COUNT` cannot lock the player out of a screen that can never be started. `eslint.config.mjs` also needed a lint-cap bump not anticipated in the plan.
- **Tradeoff — randomness source.** `Math.random()` is injected at the call site in `show()` rather than called inside the helper, keeping the helper deterministic under test. This matches the existing use of `Math.random()` in `Simulation.seedRandom()`; the project has no seeded RNG abstraction.
- **Open question.** "Reset" currently clears to an empty selection. An alternative reading is that it should re-roll a fresh random trio. This PR keeps the existing clear-to-empty behavior; say so if a re-roll is preferred.

**Suggested PR title**: `feat(gui): Preselect three random rules and move Start game button left`
