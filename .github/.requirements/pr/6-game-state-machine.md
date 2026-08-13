## Summary

Introduces a finite-state machine that drives four distinct game states — title screen, game configuration, active play, and game over — wiring each state to a dedicated DOM overlay screen and a shared in-memory hi-score list.

## Motivation

The simulation previously started immediately on page load with no way for a player to configure rules, see scores, or restart. A state machine provides a clear, enforceable structure for the game lifecycle and makes future states easy to add without modifying existing transitions.

## Changes

### Files Deleted

- None

### Files Updated

- **`src/main.ts`** — Replaced bare simulation bootstrap with a single `GameController.create(document.body).start()` call.
- **`src/simulation/Simulation.ts`** — Added `hasLivingCells(): boolean` (game-over detection) and `seedRandom(density, playerId): void` (random grid seeding at game start).
- **`src/gui/SimulationRenderer.ts`** — Added optional `onGameOver` callback to `start()` that fires when no cells remain after the minimum generation threshold; added `destroy()` to stop the loop and remove the canvas from the DOM.
- **`src/gui/index.ts`** — Barrel-exports all new GUI types.
- **`src/state/GameState.ts`** *(new)* — String literal union `GameState` with four members.
- **`src/state/StateMachine.ts`** *(new)* — `StateMachine` class enforcing valid transitions via a constant adjacency map.
- **`src/state/index.ts`** *(new)* — Barrel export for the state module.
- **`src/gui/HiScoreEntry.ts`** *(new)* — `HiScoreEntry` interface (`name`, `score`).
- **`src/gui/HiScore.ts`** *(new)* — `HiScore` class: in-memory, descending-sorted, capped at 10 entries.
- **`src/gui/RulePreset.ts`** *(new)* — `RulePreset` interface (`name`, `description`, `rule`).
- **`src/gui/AvailableRulePresets.ts`** *(new)* — Eight named `SumRule`-backed presets exported as `AVAILABLE_RULE_PRESETS`.
- **`src/gui/TitleScreen.ts`** *(new)* — Full-page DOM overlay: game title, hi-score list, "Play game" button.
- **`src/gui/GameConfigurationScreen.ts`** *(new)* — Full-page DOM overlay: checkbox list of rule presets (exactly 3 required), "Reset" button, "Start game" button.
- **`src/gui/GameOverScreen.ts`** *(new)* — Semi-transparent DOM overlay: "Game Over" heading and "Continue to title screen" button.
- **`src/gui/GameController.ts`** *(new)* — Orchestrates all screens, the `StateMachine`, `HiScore`, and `SimulationRenderer`; seeds the grid and records the final generation as the hi-score entry on each game-over event.
- **`tests/state/StateMachine.test.ts`** *(new)* — 11 unit tests covering all valid/invalid transitions and `canTransitionTo`.
- **`tests/gui/HiScore.test.ts`** *(new)* — 6 unit tests covering creation, insertion, sort order, entry cap, and immutable snapshot.

## Type of Change
- [x] New feature (non-breaking change which adds functionality)

## Implementation Plan

### Phase 1 — Introduce the state machine

**Pre-condition**: No state management exists; the simulation renders immediately on page load.

**Steps**:
1. Create `src/state/GameState.ts` defining the `GameState` string literal union with members `'title-screen'`, `'game-configuration'`, `'game'`, and `'game-over'`.
2. Create `src/state/StateMachine.ts` with a `VALID_TRANSITIONS` constant that maps each state to its allowed successors, and a `StateMachine` class with `transition()` (throws on illegal moves) and `canTransitionTo()` (predicate).
3. Create `src/state/index.ts` as a barrel export.

**Post-condition**: `StateMachine` is importable and enforces the four-state lifecycle; no UI is wired yet.

### Phase 2 — Introduce hi-score and rule-preset domain types

**Pre-condition**: Phase 1 is complete.

**Steps**:
1. Create `src/gui/HiScoreEntry.ts` with the `HiScoreEntry` interface.
2. Create `src/gui/HiScore.ts` with `HiScore` class — `addEntry()` inserts, sorts descending by score, and trims to 10; `getEntries()` returns a snapshot copy.
3. Create `src/gui/RulePreset.ts` with the `RulePreset` interface linking a display name, description, and a `Rule` instance.
4. Create `src/gui/AvailableRulePresets.ts` exporting `AVAILABLE_RULE_PRESETS` — eight `SumRule`-backed presets players can choose from.

**Post-condition**: Hi-score and rule-preset types are importable; unit tests for `HiScore` pass.

### Phase 3 — Create DOM screen overlays

**Pre-condition**: Phase 2 is complete.

**Steps**:
1. Create `src/gui/TitleScreen.ts` — `show()` builds and appends a `position:fixed` overlay with the game title, a ranked hi-score list, and a "Play game" button; `hide()` removes it.
2. Create `src/gui/GameConfigurationScreen.ts` — `show()` builds a checkbox list from `AVAILABLE_RULE_PRESETS`, enforcing exactly 3 selections; "Reset" clears all checkboxes; "Start game" is enabled only when 3 rules are ticked. `hide()` removes the overlay.
3. Create `src/gui/GameOverScreen.ts` — `show()` builds a semi-transparent overlay with "Game Over" text and a "Continue to title screen" button; `hide()` removes it.

**Post-condition**: All three overlay screens are importable and render correctly in isolation.

### Phase 4 — Extend simulation and renderer for game lifecycle

**Pre-condition**: Phase 3 is complete.

**Steps**:
1. Add `Simulation.hasLivingCells(): boolean` — returns `true` when any cell in the internal grid is non-null; used as the game-over condition.
2. Add `Simulation.seedRandom(density, playerId): void` — populates the grid randomly at `density` probability; validates `density ∈ [0, 1]`.
3. Extend `SimulationRenderer.start(onGameOver?)` — after each frame, when `simulation.generation >= MINIMUM_GENERATIONS_BEFORE_GAME_OVER` and `!simulation.hasLivingCells()`, the loop stops and `onGameOver(generation)` is invoked.
4. Add `SimulationRenderer.destroy(): void` — stops the loop and removes the canvas element from the DOM, enabling clean restarts.

**Post-condition**: The simulation correctly signals game-over and can be torn down between games.

### Phase 5 — Wire everything with GameController

**Pre-condition**: Phases 1–4 are complete.

**Steps**:
1. Create `src/gui/GameController.ts` — constructor builds one instance each of `StateMachine`, `HiScore`, `TitleScreen`, `GameConfigurationScreen`, and `GameOverScreen`; `start()` shows the title screen.
2. Implement private handlers: `handlePlayGame()` → `transition('game-configuration')` + swap screens; `handleStartGame(presets)` → `transition('game')` + create `Simulation` with selected rules + seed + start renderer; `handleGameOver(generation)` → `transition('game-over')` + record hi-score + show overlay; `handleContinueToTitleScreen()` → `transition('title-screen')` + destroy renderer + show title.
3. Update `src/main.ts` to call `GameController.create(document.body).start()`.
4. Update `src/gui/index.ts` to barrel-export all new types.

**Post-condition**: The full state-machine lifecycle works end-to-end in the browser; `npm run build` succeeds.

## Testing

### TypeScript unit tests

- **`tests/state/StateMachine.test.ts`** *(new)* — 11 tests, passing.
- **`tests/gui/HiScore.test.ts`** *(new)* — 6 tests, passing.

All prior tests continue to pass (59 tests total across 7 files).

- [x] Unit tests added/updated
- [ ] Integration tests added/updated
- [x] All tests passing (`npm run test`)

**Test coverage**: `StateMachine` — all four valid transitions, two invalid-transition guard cases, and all three `canTransitionTo` branches. `HiScore` — empty creation, single insert, sort order, entry-count cap, and snapshot immutability.

### Manual validation steps

| # | Check | How to verify |
|---|-------|---------------|
| 1 | Title screen shows on load | Open `npm run dev`; confirm the "Automata" heading, hi-score list, and "Play game" button appear before any simulation canvas. |
| 2 | Configuration screen shows after "Play game" | Click "Play game"; confirm the rule-preset checkboxes appear and "Start game" is disabled. |
| 3 | Exactly 3 rules must be selected | Tick 3 checkboxes; confirm remaining checkboxes are disabled and "Start game" becomes enabled; click "Reset" and confirm all checkboxes re-enable and "Start game" disables. |
| 4 | Game starts when "Start game" is clicked | Click "Start game"; confirm the configuration overlay disappears and the Three.js simulation canvas appears. |
| 5 | Game-over overlay appears when all cells die | Wait for all cells to die (or use rules that converge quickly); confirm the "Game Over" overlay appears over the canvas. |
| 6 | Hi-score is recorded on game over | After returning to the title screen, confirm the hi-score list shows the generation count from the completed game. |
| 7 | "Continue to title screen" returns to title | Click "Continue to title screen"; confirm the title screen re-appears with the updated hi-score list. |

## Documentation Plan

| File | Changes |
|------|---------|
| `README.md` | No changes required — this is gameplay scaffolding, not a public API change. |

## Related Issues

None

## Checklist
- [x] Code follows project conventions (static factory methods, constructor validation, PascalCase filenames)
- [x] TypeScript types are correct (`npm run typecheck` passes)
- [x] Code lints without errors (`npm run lint` passes)
- [x] All tests pass (`npm run test` passes — 59/59)
- [x] Build succeeds (`npm run build` passes)
- [x] JSDoc comments added for public APIs
- [x] No breaking changes

## Additional Notes

`SimulationRenderer.start()` is backwards-compatible — the `onGameOver` callback is optional, so existing call sites that omit it continue to work.
