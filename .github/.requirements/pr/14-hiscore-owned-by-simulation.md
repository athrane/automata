# refactor(simulation): move hi-score creation and management into the simulation

## Summary

Moves the hi-score list out of the GUI layer and into the simulation layer, so the simulation owns creating the list, deciding what a score is, and recording entries. The GUI no longer constructs `HiScore` or builds `HiScoreEntry` objects — it only queries the current list for display.

## Motivation

The hi-score is game state, but it currently lives entirely in the GUI: `GameController` creates the `HiScore` instance, keeps it alive across games, decides that a player's score is the generation the grid died on, and assembles the `HiScoreEntry` itself. The simulation — the component that actually knows the generation count and when the run ended — has no involvement. That split means the scoring rule is defined in a screen controller rather than next to the simulation state it is derived from, `HiScore` sits in `src/gui/` despite containing no DOM code, and any non-GUI consumer (a headless run, a future persistence layer) cannot reach the hi-score list at all.

## Changes

### Files Deleted

- **Delete `src/gui/HiScore.ts`** — Moved to `src/simulation/hiscore/HiScore.ts`; the class contains no DOM code and belongs to the simulation layer.
- **Delete `src/gui/HiScoreEntry.ts`** — Moved to `src/simulation/hiscore/HiScoreEntry.ts` to stay next to the class that produces and stores it.
- **Delete `tests/gui/HiScore.test.ts`** — Moved to `tests/simulation/hiscore/HiScore.test.ts` so the test path mirrors the new source path.

### Files Updated

- **`src/simulation/hiscore/HiScoreEntry.ts`** *(new file, moved)* — The `HiScoreEntry` interface (`name`, `score`), unchanged in shape.
- **`src/simulation/hiscore/HiScore.ts`** *(new file, moved)* — The existing `HiScore` class (`create`, `addEntry`, `getEntries`, `MAX_ENTRIES = 10`) with its sorting and trimming logic unchanged. Adds `HiScore.shared()`, returning the lazily created module-level list that outlives any single `Simulation`, and `HiScore.resetShared()`, which discards it so tests can start from an empty board. `create()` is retained for isolated instances.
- **`src/simulation/hiscore/index.ts`** *(new file)* — Barrel exporting `HiScore` and the `HiScoreEntry` type, matching the `src/simulation/player/index.ts` convention.
- **`src/simulation/SimulationOptions.ts`** — Adds an optional `hiScore: HiScore` field and a fourth optional `create` parameter. When omitted it resolves to `HiScore.shared()`, so ordinary games all record into the same persistent list while tests can inject a throwaway one.
- **`src/simulation/Simulation.ts`** — Stores `options.hiScore` in a private readonly field. Adds `recordHiScore(name: string): void`, which builds `{ name, score: this.generation }` and delegates to `HiScore.addEntry` — this is the scoring rule (score = generations survived) moving out of `GameController`. Adds `getHiScores(): ReadonlyArray<HiScoreEntry>` delegating to `HiScore.getEntries`, giving the GUI a read path through the simulation.
- **`src/simulation/index.ts`** — Re-exports `HiScore` and the `HiScoreEntry` type from `./hiscore`.
- **`src/gui/screens/GamePlayingScreen.ts`** — Keeps the `Simulation` it builds in a private `simulation` field instead of a local variable, so it is still reachable when the game ends. `handleGameOver` now calls `this.simulation.recordHiScore(HUMAN_PLAYER_NAME)` before forwarding to `onGameOver`, and the `onGameOver` callback type narrows from `(generation: number) => void` to `() => void` because no caller needs the generation any more. Adds `getHiScores(): ReadonlyArray<HiScoreEntry>` returning `this.simulation?.getHiScores()` or the shared list when no game has run yet.
- **`src/gui/GameController.ts`** — Drops the `hiScore` field, the `HiScore.create()` call, and the `HiScore` / `HiScoreEntry` imports. `handleGameOver` no longer takes a generation and no longer constructs an entry; it only transitions state and shows the game-over screen. `TitleScreen.create` is now passed a `() => this.gamePlayingScreen.getHiScores()` provider instead of a `HiScore` instance, with `gamePlayingScreen` constructed first. The `HUMAN_PLAYER_NAME` import moves to `GamePlayingScreen`, leaving `StateMachine`, the screens barrel, and `RulePreset` as the only imports here.
- **`src/gui/screens/TitleScreen.ts`** — Replaces the `hiScore: HiScore` constructor parameter and field with `hiScoreProvider: () => ReadonlyArray<HiScoreEntry>`, and `show()` iterates `this.hiScoreProvider()`. The screen no longer imports from `../HiScore`, only the `HiScoreEntry` type from `../../simulation`.
- **`src/gui/index.ts`** — Removes the `HiScore` and `HiScoreEntry` exports; both are now part of the `src/simulation` barrel.
- **`tests/simulation/hiscore/HiScore.test.ts`** *(new file, moved)* — The five existing `HiScore` cases with import paths updated to `../../../src/simulation/hiscore/…`, plus cases for `shared()` returning the same instance on repeated calls and `resetShared()` clearing it.
- **`tests/simulation/Simulation.test.ts`** — Adds a `recordHiScore` block: recording after N `run()` calls stores an entry whose `score` equals the generation; the recorded `name` is preserved; `getHiScores()` reflects entries added through the injected `HiScore`; and a simulation created without an explicit `hiScore` writes into `HiScore.shared()`. Uses an injected `HiScore.create()` instance for isolation except in the shared-list case, which calls `HiScore.resetShared()` first.
- **`README.md`** — Adds a "Hi-score" subsection describing that the simulation owns the list, that a score is the number of generations survived, and that abandoning a game records nothing; updates the existing "Exit" wording in the In-game controls section to point at the simulation as the owner.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [x] Documentation update
- [x] Refactoring (no functional changes)
- [x] Test coverage improvement

## Implementation Plan

### Phase 1 — Relocate `HiScore` into the simulation layer

**Pre-condition**: `HiScore` and `HiScoreEntry` live in `src/gui/` and are exported from `src/gui/index.ts`; `GameController` is their only producer. No dependencies on other phases.

**Steps**:
1. Create `src/simulation/hiscore/HiScoreEntry.ts` containing the `HiScoreEntry` interface verbatim from `src/gui/HiScoreEntry.ts`, then delete the original — moving the type first keeps the class move in step 2 a single-import change.
2. Create `src/simulation/hiscore/HiScore.ts` containing the `HiScore` class verbatim from `src/gui/HiScore.ts` (private constructor, `create`, `addEntry`, `getEntries`, `MAX_ENTRIES`), with its import rewritten to `./HiScoreEntry`, then delete the original. The sorting and trimming logic is not touched, so the moved unit tests must pass unmodified.
3. In the same file, add a module-level `let sharedHiScore: HiScore | null = null` plus `public static shared(): HiScore` (creates on first call, returns the same instance afterwards) and `public static resetShared(): void` (sets it back to `null`). This is what lets one list survive across the many `Simulation` instances a session creates, and `resetShared` is what keeps tests isolated from each other.
4. Create `src/simulation/hiscore/index.ts` exporting `{ HiScore }` and `type { HiScoreEntry }`, mirroring `src/simulation/player/index.ts`, and re-export both from `src/simulation/index.ts` so GUI code can import them from the `simulation` barrel.
5. Remove the `HiScore` and `HiScoreEntry` exports from `src/gui/index.ts`, and move `tests/gui/HiScore.test.ts` to `tests/simulation/hiscore/HiScore.test.ts` with updated relative imports, adding cases for `shared()` identity and `resetShared()`.

**Post-condition**: `HiScore` compiles from its new location with its unit tests passing; `GameController` and `TitleScreen` still fail to compile until Phase 3, because their imports now point at deleted files.

### Phase 2 — Give `Simulation` ownership of scoring

**Pre-condition**: Phase 1 is complete — `HiScore` is importable from `src/simulation/hiscore`. `Simulation` tracks `generation` but knows nothing about hi-scores.

**Steps**:
1. In `src/simulation/SimulationOptions.ts`, add a `readonly hiScore: HiScore` field, a fourth optional `hiScore?: HiScore` parameter on `create`, and resolve it with `hiScore ?? HiScore.shared()` alongside the existing `??` defaults. Defaulting here rather than in `Simulation` keeps all option resolution in one class.
2. In `src/simulation/Simulation.ts`, add `private readonly hiScore: HiScore` assigned from `options.hiScore` in the constructor.
3. In the same file, add `public recordHiScore(name: string): void` that calls `this.hiScore.addEntry({ name, score: this.generation })`. Reading the score from `this.generation` is the point of the refactor: the scoring rule now lives beside the counter it reads, instead of being reconstructed by the caller.
4. In the same file, add `public getHiScores(): ReadonlyArray<HiScoreEntry>` returning `this.hiScore.getEntries()`, giving the GUI a read path that does not require it to hold a `HiScore` reference. Add JSDoc to both methods stating that a score is the generation count reached.
5. Extend `tests/simulation/Simulation.test.ts` with a `recordHiScore` describe block using `SimulationOptions.create(w, h, players, HiScore.create())`: assert the recorded score equals the generation after a known number of `run()` calls, that the name round-trips, and that `getHiScores()` returns the injected list's contents. Add one case that omits the option, calls `HiScore.resetShared()` first, and asserts the entry lands in `HiScore.shared()`.

**Post-condition**: The simulation can record and report hi-scores and is covered by tests; the GUI does not yet call either method.

### Phase 3 — Reduce the GUI to a hi-score reader

**Pre-condition**: Phases 1 and 2 are complete. `GameController` still holds a `hiScore` field and builds `HiScoreEntry` objects, and `TitleScreen` still takes a `HiScore` instance; neither file compiles.

**Steps**:
1. In `src/gui/screens/GamePlayingScreen.ts`, promote the `simulation` local in `show()` to a private `simulation: Simulation | null` field so the instance survives past `show()`; assign it after `Simulation.create(...)` and null it in `hide()` next to the renderer teardown, so an abandoned game cannot be scored later.
2. In `handleGameOver` of the same file, call `this.simulation?.recordHiScore(HUMAN_PLAYER_NAME)` before `this.removeOverlays()` and the `onGameOver` forward. This is where the game-over write moves to, because this class is the only one holding the `Simulation`. Change the `onGameOver` field, constructor parameter, and `create` parameter from `(generation: number) => void` to `() => void`, and drop the now-unused `generation` argument at the call site; the renderer's own `onGameOver(generation)` signature is unchanged.
3. In the same file, add `public getHiScores(): ReadonlyArray<HiScoreEntry>` returning `this.simulation?.getHiScores() ?? HiScore.shared().getEntries()`, so the title screen can be shown before any game has been played.
4. In `src/gui/screens/TitleScreen.ts`, replace the `hiScore: HiScore` constructor parameter, field, and `create` parameter with `hiScoreProvider: () => ReadonlyArray<HiScoreEntry>`, and change the `show()` loop to iterate `this.hiScoreProvider()`. A provider rather than a stored list is required because `show()` runs again after every game and must see the freshly recorded entry.
5. In `src/gui/GameController.ts`, delete the `hiScore` field, the `HiScore.create()` call in the constructor, and the `HiScore` / `HiScoreEntry` imports; pass `() => this.gamePlayingScreen.getHiScores()` as the second argument to `TitleScreen.create`, declaring `gamePlayingScreen` before `titleScreen` in the constructor so the reference is initialised. Reduce `handleGameOver(generation: number)` to `handleGameOver()` containing only the state transition and `this.gameOverScreen.show()`, and drop the `HUMAN_PLAYER_NAME` import if nothing else in the file uses it.
6. Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` to confirm the layer move left no dangling imports.

**Post-condition**: No GUI file creates a `HiScore` or constructs a `HiScoreEntry`; the title screen renders whatever the simulation reports, and playing a game to the end still adds exactly one entry.

### Phase 4 — Update documentation

**Pre-condition**: Phase 3 is complete and the build is green. `README.md` mentions hi-scores only in passing, in the "In-game controls" section.

**Steps**:
1. In `README.md`, add a "Hi-score" subsection after "In-game controls" stating that the simulation owns the list, that a score is the number of generations the grid survived, and that the list keeps the top 10 entries.
2. In the same subsection, document the two public methods — `simulation.recordHiScore(name)` and `simulation.getHiScores()` — in the same table style used by the `SimulationRenderer` API section.
3. Adjust the existing "Exit" sentence in "In-game controls" so it reads as a statement about the simulation not being asked to record a score, matching the new ownership.

**Post-condition**: `README.md` documents the hi-score API in its new location and no longer implies the GUI owns the list.

## Testing

### TypeScript unit tests

- `tests/simulation/hiscore/HiScore.test.ts` *(moved from `tests/gui/HiScore.test.ts`)* — the five existing cases carried over unchanged, plus `shared()` identity and `resetShared()` cases.
- `tests/simulation/Simulation.test.ts` — new `recordHiScore` / `getHiScores` block covering score-equals-generation, name round-trip, injected-list reads, and the shared-list default.
- No new tests for `GameController`, `TitleScreen`, or `GamePlayingScreen`: they have no existing test files, and the change to them is a wiring change with no branching logic.

- [x] Unit tests added/updated
- [ ] Integration tests added/updated — none exist in this project
- [x] All tests passing (`npm run test`)

**Test coverage**: Unchanged for the `HiScore` logic itself (moved verbatim); new coverage for the `Simulation` → `HiScore` write path and for the shared-instance accessor.

**Validation evidence**:

| Command | Result |
|---------|--------|
| `npm run lint` | Passing — no errors or warnings |
| `npm run typecheck` | Passing — no diagnostics |
| `npm run test` | Passing — 10 test files, 99 tests |
| `npm run build` | Passing — `dist/assets/index-*.js`, 480.61 kB |

The manual validation steps below have not been performed; they need a browser session.

### Manual validation steps

| # | Check | How to verify |
|---|-------|---------------|
| 1 | Completing a game still records exactly one hi-score entry | `npm run dev`, play until the grid dies, continue to the title screen, and confirm one new `Player 1 — <generation>` row |
| 2 | The recorded score equals the generation the grid died on | Note the generation shown at game over and compare it with the score in the title-screen list |
| 3 | The list persists across games | Play two games to completion and confirm both entries are listed, sorted descending |
| 4 | Exiting a running game records nothing | Start a game, click "Exit", and confirm the title-screen list is unchanged |
| 5 | An empty list still renders | Load the app fresh and confirm the title screen shows the "Hi-Score" heading with no rows and no console errors |

## Documentation Plan

| File | Changes |
|------|---------|
| `README.md` | Adds a "Hi-score" subsection documenting simulation ownership, the score definition (generations survived), the 10-entry cap, and the `recordHiScore` / `getHiScores` API; rewords the "Exit" sentence in "In-game controls" |
| JSDoc in `src/simulation/Simulation.ts` | Documents `recordHiScore` and `getHiScores`, including that the score is the current generation |
| JSDoc in `src/simulation/hiscore/HiScore.ts` | Documents `shared()` and `resetShared()`, including why a process-wide list exists |

## Related Issues
Closes #14

## Checklist
- [x] Code follows project conventions (static factory methods, private constructors, one type per file)
- [x] TypeScript types are correct (`npm run typecheck` passes)
- [x] Code lints without errors (`npm run lint` passes)
- [x] All tests pass (`npm run test` passes)
- [x] Build succeeds (`npm run build` passes)
- [x] JSDoc comments added for public APIs
- [x] Updated documentation (if applicable)
- [x] No breaking changes (or documented in PR description)
- [x] Commit messages follow Conventional Commits format

## Additional Notes

**Why a shared instance.** `GamePlayingScreen` builds a fresh `Simulation` for every game, so an instance-scoped hi-score list would be wiped between runs. `HiScore.shared()` keeps one list for the process lifetime while `SimulationOptions` still allows injecting a private list, which is what the tests use. The tradeoff is module-level mutable state; `resetShared()` exists so no test can leak entries into another. If the project later adds persistence (localStorage or a backend), that accessor is the single place to change.

**Public API changes.** `HiScore` and `HiScoreEntry` move from the `src/gui` barrel to the `src/simulation` barrel, and `GamePlayingScreen.create`'s `onGameOver` parameter loses its `generation` argument. Both are internal to this repository — nothing outside `src/` imports them — so this is not treated as a breaking change.
