## Title

`feat(gui): add custom simulation model selector to the game-configuration screen`

## Summary
Adds a **Custom** option to the game-mode selector on the game-configuration screen, revealing an **Iteration strategy** picker and a **Rule-set application** picker whose chosen pair is assembled into a `ConfigurableSimulationMode` at game start. This exposes in the GUI the custom simulation model that issue #29 made configurable in code only, mirroring the existing "Custom" level option and its starting-pattern/claim-strategy pickers.

## Motivation
Issue #29 generalized generation computation into an injectable `IterationStrategy` plus `RuleSetApplicationStrategy` pair, but the only way to run a pairing other than the two named presets is to construct `ConfigurableSimulationMode` in TypeScript and rebuild the app — `README.md` states outright that "Building a custom mode is currently code-only; the game-configuration screen does not yet expose a 'Custom' mode option." A player therefore cannot try, for example, a full-grid sweep combined with player-local rule eligibility, even though the engine already supports it. The configuration screen already solves this exact shape of problem for levels (a "Custom" entry that reveals two strategy pickers), so the engine's second axis of configurability is the one remaining choice the GUI hides.

A second problem is structural: `SimulationModeOption.requiresStartPositioning` is a per-mode constant, which is only correct while every selectable mode is a fixed preset. A custom pairing needs start positions exactly when its *iteration strategy* reads `context.positions` (`PlayerLocalIterationStrategy` does; `SweepAllCellsIterationStrategy` does not), so that flag must also become available per iteration-strategy option.

## Changes

### Files Deleted
- None

### Files Updated

- **`src/gui/AvailableIterationStrategies.ts`** *(new file)* — Declares `IterationStrategyOption { name, description, strategy: IterationStrategy, requiresStartPositioning: boolean }` and exports `AVAILABLE_ITERATION_STRATEGIES`, listing `SweepAllCellsIterationStrategy` ("Sweep every cell", `requiresStartPositioning: false`) first — matching the default mode — and `PlayerLocalIterationStrategy` ("Owned and occupied cells", `requiresStartPositioning: true`). Follows the shape of `AvailableClaimStrategies.ts` and `AvailableStartPositionings.ts`.
- **`src/gui/AvailableRuleSetApplications.ts`** *(new file)* — Declares `RuleSetApplicationOption { name, description, strategy: RuleSetApplicationStrategy }` and exports `AVAILABLE_RULE_SET_APPLICATIONS`, listing `GlobalRuleSetApplicationStrategy` ("Every player competes") first and `PlayerLocalRuleSetApplicationStrategy` ("Only the owner or occupant") second.
- **`src/gui/CustomSimulationModeSelection.ts`** *(new file)* — Two pure functions extracted from the screen so they are testable under the project's node test environment: `resolveSimulationMode(isCustom, modeIndex, iterationIndex, applicationIndex): SimulationMode` and `requiresStartPositioning(isCustom, modeIndex, iterationIndex): boolean`.
- **`src/gui/screens/GameConfigurationScreen.ts`** — Adds `CUSTOM_MODE_OPTION_VALUE = 'custom'`; `buildModeControls` stops using the generic `buildOptionSelect` for the mode `<select>` and instead builds it explicitly (mirroring `buildLevelControls`) so a trailing `Custom` option can be appended after the `AVAILABLE_SIMULATION_MODES` entries. Adds fields `isCustomModeSelected`, `selectedIterationStrategyIndex`, `selectedRuleSetApplicationIndex`, all reset in `show()`. Adds `buildCustomModeControls()` returning a hidden `<div>` holding the iteration-strategy and rule-set-application pickers, shown by the mode `<select>`'s change handler when `Custom` is chosen. Adds `resolveSelectedMode(): SimulationMode` delegating to `CustomSimulationModeSelection`, called from the "Start game" handler in place of the current `AVAILABLE_SIMULATION_MODES[this.selectedModeIndex].mode` expression. Replaces the two `requiresStartPositioning` lookups (in the mode change handler and in `resolveSelectedStartPositioning`) with a single private method delegating to the same module.
- **`src/gui/index.ts`** — Exports `AVAILABLE_ITERATION_STRATEGIES` / `IterationStrategyOption`, `AVAILABLE_RULE_SET_APPLICATIONS` / `RuleSetApplicationOption`, and the two `CustomSimulationModeSelection` functions, matching how `AVAILABLE_SIMULATION_MODES` / `SimulationModeOption` and `selectRandomPresetIndices` are already exported.
- **`tests/gui/AvailableIterationStrategies.test.ts`** *(new file)* — Asserts the catalogue length, the display-name order (default-equivalent entry first), that every entry has a non-empty description and an object exposing a `cellsToVisit` function, and that `requiresStartPositioning` is `false` for the sweep entry and `true` for the player-local entry.
- **`tests/gui/AvailableRuleSetApplications.test.ts`** *(new file)* — Asserts the catalogue length, the display-name order, non-empty descriptions, and that every entry exposes `buildCandidates` and `resolveOwner` functions.
- **`tests/gui/CustomSimulationModeSelection.test.ts`** *(new file)* — Covers the extracted pure helper: a custom selection yields a `ConfigurableSimulationMode` built from the indexed catalogue entries, a preset selection yields that preset's own `mode` instance, and `requiresStartPositioning` follows the iteration strategy for a custom selection and the mode option for a preset.
- **`README.md`** — Updates the "Game modes" table row for **Custom simulation** (drop "Not yet exposed on the game-configuration screen"), rewrites the closing paragraph of "#### Custom simulation" to describe the GUI selector instead of stating that it does not exist, and extends the configuration-screen documentation with the two new picker tables.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [x] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Test coverage improvement

## Implementation Plan

### Phase 1 — Publish the two strategy catalogues to the GUI layer

**Pre-condition**: `IterationStrategy`, `SweepAllCellsIterationStrategy`, `PlayerLocalIterationStrategy`, `RuleSetApplicationStrategy`, `GlobalRuleSetApplicationStrategy`, and `PlayerLocalRuleSetApplicationStrategy` are all already exported from `src/simulation/index.ts`, but no GUI-facing named catalogue exists for either axis.

1. Create `src/gui/AvailableIterationStrategies.ts` exporting the interface `IterationStrategyOption` (`name`, `description`, `strategy: IterationStrategy`, `requiresStartPositioning: boolean`) and the constant `AVAILABLE_ITERATION_STRATEGIES: ReadonlyArray<IterationStrategyOption>`, with `SweepAllCellsIterationStrategy.create()` first (`requiresStartPositioning: false`) and `PlayerLocalIterationStrategy.create()` second (`requiresStartPositioning: true`). `requiresStartPositioning` lives here rather than only on the mode option because a custom pairing needs positions exactly when its iteration strategy reads `context.positions`, which only `PlayerLocalIterationStrategy` does.
2. Create `src/gui/AvailableRuleSetApplications.ts` exporting `RuleSetApplicationOption` (`name`, `description`, `strategy: RuleSetApplicationStrategy`) and `AVAILABLE_RULE_SET_APPLICATIONS`, with `GlobalRuleSetApplicationStrategy.create()` first and `PlayerLocalRuleSetApplicationStrategy.create()` second, so index `0` of both catalogues reproduces today's default global mode.
3. Import both files' types and values from `../simulation` (the top-level barrel) rather than from the `iteration/` and `claim/application/` subpaths, matching how `AvailableClaimStrategies.ts` and `AvailableStartPositionings.ts` already import.
4. Add `tests/gui/AvailableIterationStrategies.test.ts` and `tests/gui/AvailableRuleSetApplications.test.ts` modelled directly on `tests/gui/AvailableSimulationModes.test.ts` — length, display-name order, non-empty descriptions, a usable strategy instance per entry, plus the two `requiresStartPositioning` assertions.
5. Export both catalogues and both option types from `src/gui/index.ts`, alongside the existing `AVAILABLE_SIMULATION_MODES` / `SimulationModeOption` exports.

**Post-condition**: Both catalogues are importable from `src/gui`, each is covered by its own passing test file, and no existing file's behaviour has changed.

### Phase 2 — Reveal the custom-mode pickers on the configuration screen

**Pre-condition**: Phase 1 is complete. `GameConfigurationScreen.buildModeControls` builds the mode `<select>` through the generic `buildOptionSelect`, which renders exactly one `<option>` per catalogue entry and therefore cannot host a trailing `Custom` entry.

1. In `src/gui/screens/GameConfigurationScreen.ts`, add the module constant `const CUSTOM_MODE_OPTION_VALUE = 'custom';` next to the existing `CUSTOM_LEVEL_OPTION_VALUE`, and add the fields `isCustomModeSelected: boolean`, `selectedIterationStrategyIndex: number`, `selectedRuleSetApplicationIndex: number`, initialising all three in both the constructor and `show()` so re-showing the screen resets them exactly like every other selection.
2. Rewrite `buildModeControls` to construct the mode `<select>` explicitly — one `<option>` per `AVAILABLE_SIMULATION_MODES` entry with its index as the value, then one `Custom` option with value `CUSTOM_MODE_OPTION_VALUE` — rather than delegating to `buildOptionSelect`, because that helper's index-only contract cannot express the sentinel option. This mirrors `buildLevelControls`, which already builds its select this way for the same reason.
3. Add `private buildCustomModeControls(): HTMLElement` returning a `display:none` flex column containing two `buildOptionSelect` calls — `'Iteration strategy:'` over `AVAILABLE_ITERATION_STRATEGIES` writing `selectedIterationStrategyIndex`, and `'Rule-set application:'` over `AVAILABLE_RULE_SET_APPLICATIONS` writing `selectedRuleSetApplicationIndex` — reusing the existing helper since both catalogues satisfy its `{ readonly name: string }` constraint.
4. In the mode `<select>`'s change handler, set `isCustomModeSelected` from the sentinel comparison, toggle the custom-mode controls' `style.display` between `'flex'` and `'none'`, and set `selectedModeIndex` only for a non-custom value; then recompute the positioning controls' visibility from a single private helper instead of reading `AVAILABLE_SIMULATION_MODES[index].requiresStartPositioning` directly, because under a custom selection that array entry is not the authority.
5. Give the iteration-strategy select its own change handler that re-runs the same positioning-visibility toggle, since under a custom selection the positioning requirement is owned by the iteration strategy and can change without the mode `<select>` being touched.

**Post-condition**: Choosing "Custom" in the game-mode select reveals the two strategy pickers, choosing a preset hides them again, and the player-positioning picker's visibility tracks the iteration strategy under a custom selection and the mode option otherwise. Game start still uses the preset mode — the custom pair is captured but not yet assembled.

**Dependencies**: Depends on Phase 1 for both catalogues.

### Phase 3 — Assemble and start the selected custom model

**Pre-condition**: Phase 2 is complete. The "Start game" handler still passes `AVAILABLE_SIMULATION_MODES[this.selectedModeIndex].mode` as the configuration's `mode`, so a custom selection has no effect on the game that starts.

1. Create `src/gui/CustomSimulationModeSelection.ts` exporting two pure functions — `resolveSimulationMode(isCustom, modeIndex, iterationIndex, applicationIndex): SimulationMode`, returning `ConfigurableSimulationMode.create(AVAILABLE_ITERATION_STRATEGIES[iterationIndex].strategy, AVAILABLE_RULE_SET_APPLICATIONS[applicationIndex].strategy)` when `isCustom` and the preset's `mode` otherwise, and `requiresStartPositioning(isCustom, modeIndex, iterationIndex): boolean` — so both decisions are unit-testable under the project's `environment: "node"` Vitest configuration, which cannot construct the DOM-bound screen. `RandomRulePresetSelection.ts` is the existing precedent for extracting a screen decision into a pure, tested module.
2. In `GameConfigurationScreen.ts`, add `private resolveSelectedMode(): SimulationMode` delegating to `resolveSimulationMode(...)`, and replace the `mode:` property in the `onStartGame` payload with `this.resolveSelectedMode()`, so a new `ConfigurableSimulationMode` is built per game start rather than shared across games.
3. Replace the two direct `requiresStartPositioning` reads (the mode change handler from Phase 2 and `resolveSelectedStartPositioning`) with calls to a private method delegating to the module's `requiresStartPositioning(...)`, so the visibility of the positioning picker and the value actually passed as `GameConfiguration.startPositioning` can never disagree.
4. Add `tests/gui/CustomSimulationModeSelection.test.ts` asserting: a preset selection returns that preset's own `mode` instance (identity check against `AVAILABLE_SIMULATION_MODES[i].mode`); a custom selection returns a distinct object exposing `nextGeneration`; each custom call returns a new instance; and `requiresStartPositioning` follows the iteration strategy when custom and the mode option when not.
5. Run `npm run test`, then `npm run lint`, `npm run typecheck`, and `npm run build`.

**Post-condition**: Selecting "Custom" plus a strategy pair starts a game running a `ConfigurableSimulationMode` built from that pair, `GameConfiguration` is unchanged (it already carries `mode: SimulationMode`), and the full validation pipeline passes.

**Dependencies**: Depends on Phases 1 and 2.

### Phase 4 — Documentation

**Pre-condition**: Phase 3 is complete and the feature works end to end in the browser.

1. In `README.md`, edit the "Game modes" table's **Custom simulation** row to drop "Not yet exposed on the game-configuration screen" and state that the pairing is selectable on the configuration screen.
2. Rewrite the closing paragraph of `#### Custom simulation` (currently "Building a custom mode is currently code-only; the game-configuration screen does not yet expose a 'Custom' mode option.") to describe the selector, and note that the code-level `ConfigurableSimulationMode.create(...)` route remains available for strategies not in either catalogue.
3. Extend the configuration-screen documentation near `#### Choosing a level` with two tables listing the selectable iteration strategies and rule-set applications and their effect on play, matching the format of the existing **Claim strategy** and **Player positioning** tables, and state that choosing an iteration strategy that needs positions reveals the Player positioning picker.

**Post-condition**: `README.md` contains no remaining claim that custom modes are code-only, and every option the new selector offers is documented.

**Dependencies**: Depends on Phase 3.

## Testing

### TypeScript unit tests

This PR has not been implemented yet — it captures the design and a phased implementation plan only. All three test files listed in the Changes section (`tests/gui/AvailableIterationStrategies.test.ts`, `tests/gui/AvailableRuleSetApplications.test.ts`, `tests/gui/CustomSimulationModeSelection.test.ts`) are new and do not exist yet. No existing test file is expected to need changes: `tests/gui/AvailableSimulationModes.test.ts` asserts a length of 2 over `AVAILABLE_SIMULATION_MODES`, and the new `Custom` entry is a DOM-level sentinel option rather than a catalogue entry, so that assertion still holds.

`GameConfigurationScreen` itself has no test file today and gains none here: `vite.config.ts` sets `environment: "node"` and no test under `tests/` touches `document`, so the screen's DOM wiring is not unit-testable without adding a jsdom environment — out of scope for this PR. That is precisely why Phase 3 extracts both decisions into the pure `CustomSimulationModeSelection.ts`; the remaining screen changes are covered by the manual validation table below.

- [ ] Unit tests added/updated — planned, not yet written
- [ ] Integration tests added/updated — none planned
- [ ] All tests passing (`npm run test`) — not run, no implementation exists yet

**Test coverage**: Not applicable yet. Planned coverage is the two catalogue files plus the pure mode-resolution helper; the screen's DOM wiring is covered manually.

### Manual validation steps

| # | Check | How to verify |
|---|-------|---------------|
| 1 | The default game is unchanged | Run `npm run dev`, start a game without touching the mode select, and confirm it plays as global simulation exactly as before |
| 2 | "Custom" reveals the two new pickers | Select `Custom` in the game-mode select and confirm the Iteration strategy and Rule-set application selects appear; switch back to a preset and confirm they disappear |
| 3 | Positioning picker tracks the iteration strategy | Under `Custom`, switch the iteration strategy between "Sweep every cell" and "Owned and occupied cells" and confirm the Player positioning picker hides and reappears accordingly |
| 4 | A custom pair actually reaches the simulation | Select `Custom` with sweep-all iteration plus player-local rule application, start the game, and confirm the grid evolves differently from both presets (cells outside any player's territory are visited, but only an owner or occupant can claim them) |
| 5 | A custom pair needing positions starts correctly | Select `Custom` with owned-and-occupied iteration plus player-local rule application and a positioning strategy, start the game, and confirm the human player has a movable position and the game plays as player local simulation does |
| 6 | Each game start builds a fresh mode | Start a custom game, return to the configuration screen, change the strategy pair, and start again; confirm the second game uses the new pair |

## Documentation Plan

| File | Changes |
|------|---------|
| `README.md` | "Game modes" table: drop "Not yet exposed on the game-configuration screen" from the **Custom simulation** row. "#### Custom simulation": replace the closing "code-only" paragraph with a description of the GUI selector. Configuration-screen section: add tables for the selectable iteration strategies and rule-set applications, and note the positioning picker's dependency on the iteration strategy. |

## Related Issues
Closes #30
Related to #29

## Checklist
- [ ] Code follows project conventions (static factory methods, TypeUtils validation, etc.) — not yet implemented
- [ ] TypeScript types are correct (`npm run typecheck` passes) — not run, no implementation exists yet
- [ ] Code lints without errors (`npm run lint` passes) — not run, no implementation exists yet
- [ ] All tests pass (`npm run test` passes) — not run, no implementation exists yet
- [ ] Build succeeds (`npm run build` passes) — not run, no implementation exists yet
- [ ] JSDoc comments added for public APIs — not yet implemented
- [ ] Updated documentation (if applicable) — planned in Phase 4, not yet done
- [x] No breaking changes (or documented in PR description) — `GameConfiguration` keeps its existing shape, `SimulationModeOption` keeps `requiresStartPositioning`, and every existing barrel export is retained
- [ ] Commit messages follow Conventional Commits format — pending implementation

## Additional Notes

**Terminology.** Issue #30 is titled "custom model selector" and has no body; the codebase and `README.md` call this a simulation *mode* (`SimulationMode`, `ConfigurableSimulationMode`, `AVAILABLE_SIMULATION_MODES`). This plan keeps the code vocabulary — "mode" — and reads "model" as the issue's informal name for the same thing, which is the reading `README.md`'s own open TODO supports. If the intent was instead to make a *rule model* (the `AVAILABLE_RULE_PRESETS` list) user-definable, this plan targets the wrong axis and should be rejected before Phase 1.

**Assumption worth reviewing — where `requiresStartPositioning` lives.** The plan adds the flag to `IterationStrategyOption` and leaves the existing one on `SimulationModeOption` in place, resolving between them at selection time. The alternative is to delete the flag from `SimulationModeOption` and derive it for the presets too, from the iteration strategy each is built on — cleaner, but `GlobalSimulationMode.create()` and `PlayerLocalSimulationMode.create()` return an opaque `SimulationMode` with no way to interrogate the strategies inside, so it would require either widening that interface or re-declaring each preset as an explicit strategy pair in the catalogue. The duplicate-source-of-truth cost is contained by routing every read through one helper; changing that trade is a reasonable review request.

**Scope boundary.** The claim-resolution strategy — the third axis of `ConfigurableSimulationMode`'s behaviour — is deliberately not added to the custom-mode controls: it is already selectable under the **Custom** *level* option, because it is configured on `SimulationOptions` independently of the mode. Duplicating it under the custom mode would give the screen two controls writing the same value.

**Combination validity.** All four pairings of the two catalogues are startable, but sweep-all iteration plus player-local rule application produces a mode with no preset equivalent (every cell visited, only owners and occupants eligible). No pairing is blocked in the UI, on the grounds that exploring unusual combinations is the point of the feature.
