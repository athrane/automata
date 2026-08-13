## Summary

Adds two DOM overlays to the gameplay screen: a bottom-centre control bar with "Slow down" / "Speed up" / "Exit" buttons and a live speed readout, and a top-centre scoreboard showing the live cell count of the human player and three new computer players. To give the scoreboard four real competitors, the gameplay screen now seeds three rule-driven computer players alongside the human player.

## Motivation

Once a game starts the player has no control over it: the simulation advances one generation per animation frame with no way to slow it down for observation, no way to confirm the current rate, and no way to leave a running game short of letting the grid die out. The screen also gives no feedback on how the game is going — the grid is a single colour and the only score the game ever reports is the generation count shown after game over. There is likewise nothing to compete against; `Simulation` supports any number of players, but `GamePlayingScreen` creates exactly one.

## Changes

### Files Deleted

- None

### Files Updated

- **`src/gui/SimulationSpeed.ts`** *(new file)* — Pure, DOM-free speed model. Holds the ordered `SPEED_LEVELS` table (frames per generation `[16, 8, 4, 2, 1]`, slowest first), a current level index, and the methods `slowDown()`, `speedUp()`, `getLevel()`, `getLevelCount()`, `getFramesPerGeneration()`, `isAtMinimum()`, and `isAtMaximum()`. `speedUp()` clamps at the fastest level — one generation per animation frame, which is the rate the game runs at today and therefore the maximum the game supports. Constructed via a private constructor plus `SimulationSpeed.create()`.
- **`src/gui/GameParticipant.ts`** *(new file)* — Readonly interface `{ id, name, color }` describing one player as presented in the gameplay screen. Shared by `GamePlayingScreen`, `ScoreBoardOverlay`, and `GameController`, following the one-interface-per-file convention used by `HiScoreEntry` and `RulePreset`.
- **`src/gui/GameParticipants.ts`** *(new file)* — The participant catalogue: `HUMAN_PARTICIPANT` (id 1, "Player 1", red) and `GAME_PARTICIPANTS`, the scoreboard-ordered array of the human player plus the three computer players. Follows the `AvailableRulePresets.ts` pattern of a const catalogue in its own module. This is the single source of truth for participant names, ids, and colours: `GamePlayingScreen` builds its players, colour map, and scoreboard rows from it, and `GameController` reads `HUMAN_PARTICIPANT.name` for the hi-score entry, replacing its own `PLAYER_NAME` constant that duplicated the same string.
- **`src/gui/screens/SpeedControlOverlay.ts`** *(new file)* — Bottom-centre fixed overlay (`position:fixed;bottom:1rem;left:50%;transform:translateX(-50%)`). Renders "Slow down", a `Speed: <n>/<max>` readout, "Speed up", and "Exit". Buttons invoke injected callbacks; `refresh(speed: SimulationSpeed)` rewrites the readout and disables "Slow down" / "Speed up" at the ends of the range. Exposes `create`/`show`/`hide` matching the existing screen classes.
- **`src/gui/screens/ScoreBoardOverlay.ts`** *(new file)* — Top-centre fixed overlay (`position:fixed;top:1rem;left:50%;transform:translateX(-50%)`) rendering one row per `GameParticipant`: a colour swatch, the player name, and the score. `update(scores: ReadonlyMap<number, number>)` writes the current values into the pre-built rows without recreating DOM nodes. Exposes `create`/`show`/`hide`.
- **`src/gui/screens/GamePlayingScreen.ts`** — Builds the human player plus three computer players (ids 2–4, colours blue / green / yellow) from `GAME_PARTICIPANTS`; computer rules are drawn from `AVAILABLE_RULE_PRESETS` via `selectRandomPresetIndices`. Seeds each player separately at `PLAYER_SEED_DENSITY`, registers all four colours in `GuiOptions`, owns a `SimulationSpeed` and both overlays, and starts a `setInterval` that pushes `simulation.getCellCounts()` into the scoreboard. `create` gains an `onExit` callback. The renderer's game-over callback is now wrapped so the overlays and the refresh timer are torn down before the game-over screen appears; `hide()` shares that teardown via a private `removeOverlays()`.
- **`src/gui/SimulationRenderer.ts`** — Adds a `framesPerGeneration` field (default `1`, unchanged behaviour) and a frame counter. The animation loop still runs every frame, but only calls `simulation.run()` when the counter reaches `framesPerGeneration`, so lower speeds hold each generation on screen for several frames. Adds `setFramesPerGeneration(frames: number): void`, which resets the frame counter and throws `RangeError` for values below 1.
- **`src/simulation/Simulation.ts`** — Adds `getCellCounts(): Map<number, number>` returning the number of living cells per player id in a single grid pass, with a zero entry for every registered player so the scoreboard always has four rows. `seedRandom` now skips cells that are already occupied, so seeding four players in sequence no longer lets the last player overwrite the others.
- **`src/state/StateMachine.ts`** — Adds `'title-screen'` to the transitions permitted from `'game'` so "Exit" can abandon a running game. `'game' → 'game-over'` is unchanged.
- **`src/gui/GameController.ts`** — Passes a `handleExitGame()` callback into `GamePlayingScreen.create`. The handler transitions to `'title-screen'`, hides the gameplay screen, and shows the title screen without recording a hi-score entry. The class JSDoc now documents the `game → title-screen` exit path. The local `PLAYER_NAME = 'Player 1'` constant is deleted in favour of `HUMAN_PARTICIPANT.name`, so the human player's name is spelled once.
- **`src/gui/screens/index.ts`** — Exports `ScoreBoardOverlay` and `SpeedControlOverlay`.
- **`src/gui/index.ts`** — Re-exports `SimulationSpeed`, `GameParticipant`, `ScoreBoardOverlay`, and `SpeedControlOverlay`, following the existing barrel convention.
- **`tests/gui/SimulationSpeed.test.ts`** *(new file)* — Six unit tests for the speed model: default level, clamping at both ends, round-tripping up and down the level table, and the frames-per-generation mapping.
- **`tests/simulation/Simulation.test.ts`** — Adds a `getCellCounts` block (empty grid, cells attributed to the right player, zero-cell player still present) and a `seedRandom` block (occupied cells preserved, `RangeError` on an out-of-range density).
- **`tests/state/StateMachine.test.ts`** — Adds a case asserting `'game' → 'title-screen'` is now permitted, alongside the existing `'game' → 'game-over'` case.
- **`README.md`** — Adds `setFramesPerGeneration` to the `SimulationRenderer` API table, documents the optional `onGameOver` argument on `.start()`, and adds an "In-game controls" subsection describing the two overlays.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [x] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [x] Test coverage improvement

## Implementation Plan

### Phase 1 — Add a testable speed model and frame-throttled rendering

**Pre-condition**: `SimulationRenderer.start()` calls `simulation.run()` once per `requestAnimationFrame` callback with no throttling, and the renderer has no notion of speed. No dependencies on other phases.

**Steps**:
1. Create `src/gui/SimulationSpeed.ts` exporting a `SimulationSpeed` class with a module-level `const SPEED_LEVELS: ReadonlyArray<number> = [16, 8, 4, 2, 1]` (frames per generation, slowest first) and a `DEFAULT_LEVEL_INDEX` pointing at the fastest entry, so a game still starts at today's rate. Give it a private constructor and a static `create()`, matching `HiScore` and `GuiOptions`.
2. In the same file, implement `slowDown()` and `speedUp()` as index moves clamped with guard clauses at `0` and `SPEED_LEVELS.length - 1`, plus the read accessors `getLevel()` (1-based, for display), `getLevelCount()`, `getFramesPerGeneration()`, `isAtMinimum()`, and `isAtMaximum()`. Clamping at the fastest entry is what enforces "max speed is the speed the game currently supports".
3. In `src/gui/SimulationRenderer.ts`, add private fields `framesPerGeneration` (initialised to `1`) and `frameCount` (initialised to `0`), and a public `setFramesPerGeneration(frames: number): void` that throws `RangeError('frames must be at least 1')` for `frames < 1` — mirroring the `RangeError` style already used by `GuiOptions.create` and `Simulation.seedRandom`.
4. In `SimulationRenderer.start`, move `this.simulation.run()` behind a counter: increment `frameCount` each frame and only advance the simulation and reset the counter when `frameCount >= this.framesPerGeneration`. Keep `this.render()` and `this.renderer.render(...)` on every frame so the canvas stays responsive, and leave the game-over check where it is.
5. Create `tests/gui/SimulationSpeed.test.ts` with AAA-structured cases: a new instance reports the fastest level and `isAtMaximum() === true`; `speedUp()` at the maximum is a no-op; `slowDown()` four times reaches level 1 and `isAtMinimum() === true`; `slowDown()` at the minimum is a no-op; and `getFramesPerGeneration()` returns the expected value at each level.

**Post-condition**: `SimulationSpeed` exists with passing unit tests and `SimulationRenderer` can be throttled, but nothing calls `setFramesPerGeneration`, so gameplay is byte-for-byte unchanged.

### Phase 2 — Expose per-player cell counts and non-destructive seeding

**Pre-condition**: `Simulation` exposes only `getGrid`, `hasLivingCells`, and `seedRandom`; `seedRandom` writes `playerId` into any cell that passes the density roll, including occupied ones. Independent of Phase 1.

**Steps**:
1. In `src/simulation/Simulation.ts`, add `public getCellCounts(): Map<number, number>`. Pre-populate the map with a `0` entry for every id in `this.players` so callers always get one row per player, then walk the grid once and increment the entry for each non-null cell. Returning zeros rather than omitting absent players keeps the scoreboard row count stable as players die out.
2. In `seedRandom`, add a guard clause inside the inner loop that skips a cell when `this.grid[y][x] !== null`. With a single player on an empty grid this is unobservable; with four players seeded in sequence it stops each call from overwriting the previous player's cells.
3. Update the `seedRandom` JSDoc to state that occupied cells are left untouched, and add JSDoc for `getCellCounts` describing the zero-entry guarantee.
4. Extend `tests/simulation/Simulation.test.ts` with cases for `getCellCounts`: an empty grid returns zero for each registered player; cells set via `setCell` are counted against the right player; a player with no cells still appears with `0`. Add a `seedRandom` case that pre-fills a cell via `setCell`, seeds a second player at density `1`, and asserts the pre-filled cell still belongs to the first player.

**Post-condition**: The simulation can report live per-player scores and can be seeded for several players without one clobbering another; no GUI code uses either capability yet.

### Phase 3 — Build the two overlays

**Pre-condition**: Phases 1 and 2 are complete — `SimulationSpeed` and `Simulation.getCellCounts` exist. `src/gui/screens/` contains four screen classes, all following the `create` / `show` / `hide` shape with inline `style.cssText`.

**Steps**:
1. Create `src/gui/screens/SpeedControlOverlay.ts` with `create(container, onSlowDown, onSpeedUp, onExit)`. In `show(speed: SimulationSpeed)`, build a fixed-position row pinned to the bottom centre and append, in order: a "Slow down" button, a `<span>` readout, a "Speed up" button, and an "Exit" button; wire each button's `click` listener to its callback. Keep references to the two speed buttons and the readout in private fields.
2. In the same class, add `refresh(speed: SimulationSpeed): void` that sets the readout to `Speed: ${speed.getLevel()}/${speed.getLevelCount()}` and sets `disabled` on the "Slow down" / "Speed up" buttons from `isAtMinimum()` / `isAtMaximum()`, so the player can see when the maximum supported speed is reached. Add `hide()` removing the element and nulling the field, matching `GameOverScreen.hide`.
3. Create `src/gui/screens/ScoreBoardOverlay.ts` with `create(container)` and `show(players: ReadonlyArray<{ id: number; name: string; color: number }>)`. Build one row per player containing a colour swatch (`background:#RRGGBB` derived from the hex integer) and a name label, and store each row's value `<span>` in a `Map<number, HTMLElement>` keyed by player id.
4. In the same class, add `update(scores: ReadonlyMap<number, number>): void` that writes each score into its stored `<span>` via `textContent`, touching no other DOM node, plus a `hide()` following the same pattern as the other screens.
5. Export both classes from `src/gui/screens/index.ts` and re-export them, together with `SimulationSpeed`, from `src/gui/index.ts`.

**Post-condition**: Both overlays exist, are exported, and can be rendered and refreshed in isolation; nothing constructs them yet.

### Phase 4 — Wire the overlays, computer players, and exit into the gameplay flow

**Pre-condition**: Phases 1–3 are complete. `GamePlayingScreen.show` currently builds one player, seeds it at `SEED_DENSITY = 0.3`, and starts the renderer; `StateMachine` forbids `'game' → 'title-screen'`. Depends on all prior phases.

**Steps**:
1. In `src/state/StateMachine.ts`, change the `'game'` entry of `VALID_TRANSITIONS` to `['game-over', 'title-screen']`, and add a case to `tests/state/StateMachine.test.ts` asserting the new transition is allowed while `'game' → 'game-over'` still is.
2. In `src/gui/screens/GamePlayingScreen.ts`, replace `PLAYER_COLOR` with a module-level table of the four participants — `{ id, name, color }` for `Player 1` (red) and `Computer 1`–`Computer 3` (blue, green, yellow) — and replace `SEED_DENSITY` with `PLAYER_SEED_DENSITY = 0.075`, so total occupancy after seeding four players stays near today's 0.3.
3. In `show()`, map that table into `Player` objects: the human player keeps `selectedPresets`, while each computer player takes `selectRandomPresetIndices(AVAILABLE_RULE_PRESETS.length, RULES_PER_COMPUTER_PLAYER, Math.random)` mapped to `AVAILABLE_RULE_PRESETS[i].rule`. Pass all four to `SimulationOptions.create`, call `simulation.seedRandom(PLAYER_SEED_DENSITY, id)` once per player, and build the `GuiOptions` colour map from the same table.
4. Still in `show()`, create the `SimulationSpeed` and both overlays. Show the scoreboard with the participant table, show the speed overlay with the speed model, and hand the speed overlay three callbacks: slow down and speed up each mutate the model, call `this.renderer.setFramesPerGeneration(speed.getFramesPerGeneration())`, and call `overlay.refresh(speed)`; exit invokes the new `onExit` callback.
5. Start a `setInterval` at `SCORE_REFRESH_INTERVAL_MS = 200` that calls `this.scoreBoard.update(simulation.getCellCounts())`, storing the handle in a private field. Refreshing on an interval rather than inside the render loop keeps DOM writes off the animation frame and leaves `SimulationRenderer` free of GUI concerns.
6. Extend `hide()` to `clearInterval` the stored handle, null it, and hide both overlays before the existing renderer teardown, so exiting or returning from game over leaves no orphaned overlay or timer behind.
7. In `src/gui/GameController.ts`, pass a fourth argument to `GamePlayingScreen.create` bound to a new private `handleExitGame()` that calls `this.stateMachine.transition('title-screen')`, `this.gamePlayingScreen.hide()`, and `this.titleScreen.show()` — deliberately not adding a hi-score entry, since an abandoned game is not a completed run.

**Post-condition**: Starting a game shows four coloured populations competing on the grid, a live scoreboard at the top centre, and a speed/exit bar at the bottom centre; the speed buttons visibly change the generation rate and disable at the ends of the range; "Exit" returns to the title screen with all overlays and timers cleaned up.

### Phase 5 — Documentation

**Pre-condition**: Phase 4 is complete and the behaviour is settled. Depends on Phase 4.

**Steps**:
1. Add a `setFramesPerGeneration(frames)` row to the `SimulationRenderer` API table in `README.md`, describing the throttle and the `RangeError` on values below 1.
2. Add an "In-game controls" subsection under "Browser GUI" describing the bottom speed/exit bar, the speed range, and the top scoreboard with its four players.
3. Update the `.start()` row of the same table to mention the optional `onGameOver` callback, which is already implemented but undocumented and is now visible to anyone reading the new controls section.

**Post-condition**: `README.md` documents the renderer's speed API and the two in-game overlays.

## Testing

### TypeScript unit tests

- **`tests/gui/SimulationSpeed.test.ts`** *(new)* — 6 tests covering the default level, clamping at both ends of the level table, stepping down and back up, and the frames-per-generation mapping `[1, 2, 4, 8, 16]`. Status: **passing**.
- **`tests/simulation/Simulation.test.ts`** *(updated)* — 5 new tests: `getCellCounts` on an empty grid, cells attributed to their owning player, a zero-cell player still present in the map; `seedRandom` leaving an occupied cell alone at density 1, and rejecting a density above 1. Status: **passing**.
- **`tests/state/StateMachine.test.ts`** *(updated)* — 1 new test for the `'game' → 'title-screen'` transition. Status: **passing**.
- **The overlays and `GamePlayingScreen` are not unit tested.** The Vitest environment is `node` (see `vite.config.ts`), so `document` is unavailable and DOM construction cannot be exercised without adding a `jsdom` dependency and switching the test environment — out of scope, and consistent with the existing untested screen classes. The non-trivial logic is therefore pushed into the DOM-free `SimulationSpeed` and `Simulation.getCellCounts`, which are tested; the DOM behaviour is covered by the manual validation steps below.
- **`SimulationRenderer.setFramesPerGeneration` is not unit tested.** The renderer constructs a `THREE.WebGLRenderer` in its constructor, which needs a browser canvas, so the class cannot be instantiated under the `node` environment. Its throttle logic is a two-line counter over the injected `SimulationSpeed` value, which is tested; the observable behaviour is covered by manual steps 3–5.

- [x] Unit tests added/updated — 12 new tests
- [ ] Integration tests added/updated — not applicable; no DOM test environment exists in this project
- [x] All tests passing (`npm run test` — 78/78, 9 files)

**Test coverage**: New coverage for `SimulationSpeed` (6 cases) and `Simulation.getCellCounts` / `seedRandom` (5 cases), plus 1 case for the new state transition — 66 → 78 tests. `SimulationRenderer`, `GamePlayingScreen`, and the two overlays remain untested at the DOM level, as they are today.

### Manual validation steps

| # | Check | How to verify |
|---|-------|---------------|
| 1 | Speed bar renders bottom centre | `npm run dev`; start a game and confirm the "Slow down / Speed: n/5 / Speed up / Exit" row is horizontally centred at the bottom of the viewport, above the canvas. |
| 2 | Scoreboard renders top centre | Confirm four rows — Player 1 plus Computer 1–3 — each with a colour swatch matching that player's cells, horizontally centred at the top of the viewport. |
| 3 | "Slow down" reduces the generation rate | Click "Slow down" repeatedly and confirm the grid visibly updates more slowly at each step and the readout counts down to `Speed: 1/5`. |
| 4 | "Speed up" is capped at the current maximum | From the slowest setting, click "Speed up" until the readout reads `Speed: 5/5`; confirm the button becomes disabled and further clicks do nothing. |
| 5 | "Slow down" is capped at the minimum | At `Speed: 1/5`, confirm "Slow down" is disabled. |
| 6 | Scores are live and per player | Watch the scoreboard for several seconds and confirm each player's number changes as its population grows or shrinks, and that a wiped-out player shows `0` rather than disappearing. |
| 7 | Computer players use different rules | Start several games and confirm the four populations behave differently from one another and that the computer players' behaviour varies between games. |
| 8 | "Exit" returns to the title screen | Click "Exit" mid-game; confirm the canvas and both overlays are removed, the title screen appears, and no hi-score entry was added for the abandoned game. |
| 9 | Exit leaves no leaked timer or overlay | After exiting, start a second game and confirm exactly one scoreboard and one speed bar are present and the scores are not updating twice as fast. |
| 10 | Game over still works | Slow the game to `Speed: 1/5`, let the grid die out, and confirm the game-over screen appears, the overlays are gone, and the generation count is recorded in the hi-score list. |

### Command output

- `npm run lint` — passed, no errors or warnings.
- `npm run typecheck` — passed, no errors.
- `npm run test` — passed, 78/78 tests across 9 files (baseline before this PR: 66/66 across 8 files).
- `npm run build` — passed, `vite build` completed in 150 ms; 26 modules, `dist/assets/index-*.js` 480.06 kB.

> **Note on later runs.** After these figures were recorded, an unrelated toroidal-grid change (`src/simulation/WrapCoordinate.ts`, `GeometryRule`, `SumRule`; see `.github/.requirements/pr/3-toroidal-grid.md`) appeared in the same working tree. All four commands still pass on the combined tree — 91/91 tests across 10 files — but the extra 13 tests belong to that change, not this one. This PR must be branched off a tree without it before the numbers above can be reproduced in isolation.

## Documentation Plan

| File | Changes |
|------|---------|
| `README.md` | Add `setFramesPerGeneration(frames)` to the `SimulationRenderer` API table; document the optional `onGameOver` argument on `.start()`; add an "In-game controls" subsection under "Browser GUI" describing the bottom speed/exit bar and the top scoreboard. |

## Related Issues

Closes #13

## Checklist
- [x] Code follows project conventions (static factory methods, private constructors, no `any`, explicit types, guard clauses, one type per file, barrel exports)
- [x] TypeScript types are correct (`npm run typecheck` passes)
- [x] Code lints without errors (`npm run lint` passes)
- [x] All tests pass (`npm run test` passes — 78/78)
- [x] Build succeeds (`npm run build` passes)
- [x] JSDoc comments added for public APIs — `SimulationSpeed`, `GameParticipant`, both overlays, `Simulation.getCellCounts`, and `SimulationRenderer.setFramesPerGeneration`; the `seedRandom` and `start` docs were updated for their changed behaviour
- [x] Updated documentation — `README.md` changes as specified in the Documentation Plan
- [x] No breaking changes — `SimulationRenderer.start` and `Simulation.seedRandom` keep their signatures; `GamePlayingScreen.create` gains a required third argument, but its only caller is `GameController`
- [ ] Commit messages follow Conventional Commits format — nothing committed yet

## Additional Notes

- **Implemented, not committed.** All five phases are implemented in the working tree on `main` (base commit `f1a5638`) and validated; no branch, commit, push, or `gh pr create` has been run. The manual validation steps in the table above have **not** been performed — they need a browser.
- **Deviation from the plan — participant type.** Phase 3 specified an inline `{ id; name; color }` parameter on `ScoreBoardOverlay.show`. The implementation extracts it into `src/gui/GameParticipant.ts` instead, since both the overlay and `GamePlayingScreen` need the shape and the project keeps one interface per file.
- **Deviation from the plan — overlay teardown at game over.** Phase 4 only removed the overlays in `hide()`, which runs when the player continues from the game-over screen. Because the overlays sit above the game-over screen in the stacking order, they would have covered it. `GamePlayingScreen` now wraps the renderer's game-over callback and removes the overlays there, leaving the final grid visible behind the game-over screen.
- **Design decision — three computer players.** The scoreboard requirement names "the three computer players", but the game has none today; `GamePlayingScreen` builds a single human player. Rather than ship four rows where three are permanently empty, this PR introduces the computer players so the scoreboard has something to report. This is the largest part of the change and could be split into a separate PR if preferred.
- **Design decision — what "high score" means.** The scoreboard shows each player's *live* cell count, refreshed every 200 ms. The alternatives considered were the peak cell count reached during the current game, and the persisted `HiScore` generation counts (which are static during play and recorded only for the human player). The live count is the only reading that makes the four players a visible contest.
- **Design decision — maximum speed.** The fastest level is one generation per animation frame, which is exactly what the game does today, satisfying "the max speed is the speed the game currently supports". Slower levels hold a generation for 2, 4, 8, or 16 frames; rendering still happens every frame.
- **Tradeoff — seeding density.** Seeding four players at the current `0.3` would fill the grid, so each player is seeded at `0.075` and `seedRandom` now skips occupied cells. Total starting occupancy is therefore roughly comparable to today's, but the human player starts with about a quarter of the cells it used to — early games will look sparser for that player.
- **Open question — exit and hi-scores.** `handleExitGame` deliberately records no hi-score entry, on the grounds that an abandoned game is not a completed run. If exiting should still record the generation reached, that is a one-line change to `GameController`.

**Suggested PR title**: `feat(gui): Add in-game speed control and score overlays with three computer players`
