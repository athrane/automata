# feat(simulation): add player local simulation game mode

## Summary

Introduces a second fundamental game mode, **player local simulation**, alongside the existing **global simulation** mode, selectable on the game-configuration screen. In player local simulation every player holds a position on the grid, a generation applies a player's rules only to the cells that player owns plus the cell it occupies, and the human player walks their position with `W`/`A`/`X`/`D`. Start positions are assigned by a pluggable start-positioning strategy — either the first cell the starting pattern claimed for that player, or a random one among them.

**Status: planned — not implemented.** This document is the design output of a `grill-me` interview held before any code was written; the working tree is clean and no phase below has been built. Every validation line in Testing therefore reads *not run*.

## Motivation

Today the simulation has exactly one shape: `Simulation.run()` sweeps all 10,000 cells and asks every player's rules about every one of them. The player's only agency is the three rule presets chosen before the game starts — once "Start game" is clicked the human is a spectator, and the in-game controls are limited to speed and exit. Every level, every claim strategy and every starting pattern added so far (#15, #16, #19) varies the *opening* of that same non-interactive sweep.

The project has no notion of *where a player is*. That absence blocks every game mechanic that depends on locality: territory a player can reach, a front line between two players, an action taken at a place. It also means the four participants are distinguished only by their rules, so a game is fully determined at generation 0.

This PR adds the smallest concept that unblocks all of that — a per-player grid position — and one new mode that uses it, without changing how global simulation behaves. Mode selection sits next to the existing level, pattern and claim-strategy pickers, so the current game remains reachable unchanged and becomes one of two explicit choices rather than an unnamed default.

## Changes

### Files Deleted

- None

### Files Updated

**Simulation — mode abstraction**

- **`src/simulation/mode/SimulationMode.ts`** *(new file)* — `SimulationMode` interface with a single method `nextGeneration(context: GenerationContext): Grid`. The seam that makes the per-generation sweep replaceable without editing `Simulation`.
- **`src/simulation/mode/GenerationContext.ts`** *(new file)* — `GenerationContext` interface: `readonly grid: Grid`, `readonly players: ReadonlyArray<Player>`, `readonly generation: number`, `readonly positions: ReadonlyMap<number, GridPosition>`, `readonly cellClaim: CellClaim`. A context object rather than five positional parameters, mirroring the existing `ClaimContext`.
- **`src/simulation/mode/GlobalSimulationMode.ts`** *(new file)* — `GlobalSimulationMode implements SimulationMode`, private constructor, `static create()`. Holds the exact double loop lifted verbatim out of `Simulation.run()`, calling `cellClaim.resolve(grid, x, y, players, generation)` for every cell. Behaviour-preserving extraction.
- **`src/simulation/mode/PlayerLocalSimulationMode.ts`** *(new file)* — `PlayerLocalSimulationMode implements SimulationMode`, private constructor, `static create()`. Buckets the grid's non-null cells by owner in one pass, then for each player resolves only that player's owned cells plus its occupied cell, passing a single-element `[player]` array to `cellClaim.resolve` so only that player's rules are consulted.
- **`src/simulation/mode/index.ts`** *(new file)* — Barrel exporting `SimulationMode`, `GenerationContext` (types) and both implementations.

**Simulation — player position**

- **`src/simulation/player/GridPosition.ts`** *(new file)* — `GridPosition` interface: `readonly x: number`, `readonly y: number`. A position value, deliberately not a field on `Player`, because `LevelRoster.computers` holds shared `Player` objects reused across games and a mutable position on them would leak state between runs.
- **`src/simulation/player/StartPositioningStrategy.ts`** *(new file)* — `StartPositioningStrategy` interface with `selectPosition(grid: Grid, playerId: number): GridPosition`. Reads the seeded grid rather than the `StartingPattern`, so no existing pattern implementation has to grow an enumeration method.
- **`src/simulation/player/FirstClaimedCellPositioning.ts`** *(new file)* — `FirstClaimedCellPositioning implements StartPositioningStrategy`, private constructor, `static create()`. Scans row-major (top-left → bottom-right) and returns the first cell owned by `playerId`; throws `RangeError('player has no claimed cells')` when the player owns none.
- **`src/simulation/player/RandomClaimedCellPositioning.ts`** *(new file)* — `RandomClaimedCellPositioning implements StartPositioningStrategy`, private constructor, `static create(random?: () => number)` defaulting to `Math.random`. Collects every cell owned by `playerId` and picks one uniformly. The injected generator follows the convention already used by `selectRandomPresetIndices`, so tests are deterministic.
- **`src/simulation/player/index.ts`** — Exports the new `GridPosition`, `StartPositioningStrategy` types and both positioning classes alongside `Player`.

**Simulation — wiring**

- **`src/simulation/Simulation.ts`** — Adds `private readonly positions: Map<number, GridPosition>` and `private readonly mode: SimulationMode`. `run()` loses its double loop and becomes a delegation to `this.mode.nextGeneration({...})`, keeping the generation increment and score accumulation that follow it. Adds `getPlayerPosition(playerId): GridPosition | undefined`, `applyStartPositioning(strategy: StartPositioningStrategy): void` (assigns one position per registered player), and `movePlayer(playerId, dx, dy): boolean` which wraps the target through `wrapCoordinate` and rejects the move when the target cell is owned by a different player.
- **`src/simulation/SimulationOptions.ts`** — Gains a `readonly mode: SimulationMode` field and a trailing optional `mode` parameter on `create`, defaulting to `GlobalSimulationMode.create()` so every existing call site keeps today's behaviour.
- **`src/simulation/level/Level.ts`** — `createSimulation` becomes `createSimulation(humanRules: Rule[], mode?: SimulationMode, startPositioning?: StartPositioningStrategy, hiScore?: HiScore)`. It passes `mode` into `SimulationOptions.create` and, when `startPositioning` is supplied, calls `simulation.applyStartPositioning(...)` after `applyStartingPattern(...)` so positions are derived from the seeded grid. All four parameters are optional; existing callers are unaffected.
- **`src/simulation/index.ts`** — Re-exports the new mode and positioning names from `./mode` and `./player`.

**GUI**

- **`src/gui/GameConfiguration.ts`** *(new file)* — `GameConfiguration` interface: `readonly level: Level`, `readonly presets: RulePreset[]`, `readonly mode: SimulationMode`, `readonly startPositioning: StartPositioningStrategy | null`. One value object carried from the configuration screen to the playing screen, so future configuration options do not widen three callback signatures again.
- **`src/gui/AvailableSimulationModes.ts`** *(new file)* — `SimulationModeOption` interface (`name`, `description`, `mode`, `requiresStartPositioning`) and `AVAILABLE_SIMULATION_MODES` listing "Global simulation" and "Player local simulation". Mirrors the existing `AVAILABLE_CLAIM_STRATEGIES` catalogue shape.
- **`src/gui/AvailableStartPositionings.ts`** *(new file)* — `StartPositioningOption` interface (`name`, `description`, `strategy`) and `AVAILABLE_START_POSITIONINGS` listing "First claimed cell" and "Random claimed cell".
- **`src/gui/PlayerInputController.ts`** *(new file)* — Owns the `keydown` listener for a running game. `create(simulation, playerId)`, `attach()`, `detach()`. Maps `a`/`d`/`w`/`x` (case-insensitive) to `simulation.movePlayer(playerId, ∓1/±1, ...)` and calls `preventDefault()` on a handled key. Kept out of `GamePlayingScreen` so input handling is one responsibility in one class.
- **`src/gui/screens/GameConfigurationScreen.ts`** — Adds a "Game mode" `<select>` populated from `AVAILABLE_SIMULATION_MODES`, and a "Player positioning" `<select>` populated from `AVAILABLE_START_POSITIONINGS`, revealed only while the selected mode's `requiresStartPositioning` is true — the same show/hide mechanism already used for the custom-level controls. `onStartGame` narrows from `(level, selected)` to a single `GameConfiguration` argument.
- **`src/gui/GameController.ts`** — `handleStartGame` takes a `GameConfiguration` and forwards it to `gamePlayingScreen.show(configuration)`.
- **`src/gui/screens/GamePlayingScreen.ts`** — `show(configuration)` passes the mode and positioning strategy into `level.createSimulation`, and creates plus attaches a `PlayerInputController` for `HUMAN_PLAYER_ID` when the configuration carries a positioning strategy. `hide()` and `handleGameOver()` detach it, so no listener survives a game.
- **`src/gui/SimulationRenderer.ts`** — After the grid colour pass, `render()` overrides the mesh at each player's position with a colour oscillating between that player's colour and white, driven by `performance.now()` rather than `frameCount` so the pulse rate is independent of simulation speed. Adds `POSITION_PULSE_PERIOD_MS` and `POSITION_PULSE_COLOR` constants.
- **`src/gui/index.ts`** — Exports `GameConfiguration`, the two new catalogues and `PlayerInputController`.

**Tests**

- **`tests/simulation/mode/GlobalSimulationMode.test.ts`** *(new file)*
- **`tests/simulation/mode/PlayerLocalSimulationMode.test.ts`** *(new file)*
- **`tests/simulation/player/FirstClaimedCellPositioning.test.ts`** *(new file)*
- **`tests/simulation/player/RandomClaimedCellPositioning.test.ts`** *(new file)*
- **`tests/simulation/Simulation.test.ts`** *(updated)* — `movePlayer` legality and wrapping, `applyStartPositioning`, `getPlayerPosition`, and that `run()` delegates to the injected mode.
- **`tests/simulation/level/Level.test.ts`** *(updated)* — `createSimulation` honours the mode and positioning arguments and still defaults to global simulation without them.
- **`tests/gui/AvailableSimulationModes.test.ts`** *(new file)*
- **`tests/gui/AvailableStartPositionings.test.ts`** *(new file)*
- **`tests/integration/PlayerLocalGame.test.ts`** *(new file)* — Full level → configuration → generations run in player local mode.
- **`README.md`** — New "Game modes" section, `W`/`A`/`X`/`D` added to "In-game controls", and a note under the configuration screen describing the positioning picker.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [x] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [x] Documentation update
- [x] Refactoring (no functional changes)
- [x] Test coverage improvement

`GameConfigurationScreen`'s `onStartGame` callback, `GameController.handleStartGame` and `GamePlayingScreen.show` all narrow to a single `GameConfiguration` parameter. Each has exactly one caller, all inside `src/gui/`, all updated in Phase 5 — the same shape of internal-only break taken in #15 and #19. `Simulation.run()`, `SimulationOptions.create` and `Level.createSimulation` remain source-compatible: every new parameter is optional and defaults to today's behaviour.

## Implementation Plan

### Phase 1 — Extract the generation sweep behind a SimulationMode strategy

**Pre-condition**: `Simulation.run()` contains the only generation sweep in the codebase, hard-coded as a double loop over the full grid. No dependencies on other phases.

**Steps**:
1. Create `src/simulation/mode/GenerationContext.ts` declaring `export interface GenerationContext` with `readonly grid: Grid`, `readonly players: ReadonlyArray<Player>`, `readonly generation: number`, `readonly positions: ReadonlyMap<number, GridPosition>` and `readonly cellClaim: CellClaim`. A context object is used instead of five positional parameters because `ClaimStrategy.selectWinner` already establishes that convention for the per-cell path.
2. Create `src/simulation/mode/SimulationMode.ts` declaring `export interface SimulationMode { nextGeneration(context: GenerationContext): Grid }`. The method returns the new grid rather than mutating the old one, matching how `run()` already builds `nextGrid` before assigning it, which is required for a synchronous cellular automaton.
3. Create `src/simulation/mode/GlobalSimulationMode.ts` with a private constructor, `public static create(): GlobalSimulationMode`, and a `nextGeneration` holding the double loop copied verbatim from `Simulation.run()` lines 104–118, reading `players`, `generation` and `cellClaim` off the context and ignoring `positions`.
4. Create `src/simulation/mode/index.ts` exporting all three names, and re-export them from `src/simulation/index.ts`, so GUI code can import a mode from the package root as it already does for claim strategies.
5. Create `tests/simulation/mode/GlobalSimulationMode.test.ts` asserting that a known 3×3 grid with a single-player survive rule produces the same next grid the current `Simulation.run()` produces for the same input, that an empty grid stays empty, and that the returned grid is a new array rather than the input instance.

**Post-condition**: `GlobalSimulationMode` is a tested, standalone class reproducing the current sweep. `Simulation` is unchanged and still runs its own loop; nothing constructs the mode outside its own test.

### Phase 2 — Introduce grid positions and the positioning strategies

**Pre-condition**: Phase 1 is complete, so `GenerationContext` already names a `positions` map that nothing yet populates. `Player` carries only `id`, `name` and `rules`.

**Steps**:
1. Create `src/simulation/player/GridPosition.ts` declaring `export interface GridPosition { readonly x: number; readonly y: number }`. Document on the interface why the position is not a field on `Player`: `LevelRoster.computers` holds shared `Player` instances reused by every game started from that level, so a mutable position on them would leak between runs.
2. Create `src/simulation/player/StartPositioningStrategy.ts` declaring `export interface StartPositioningStrategy { selectPosition(grid: Grid, playerId: number): GridPosition }`, documenting that it is called once, after the starting pattern has been applied, and must throw rather than return a position outside the grid.
3. Create `src/simulation/player/FirstClaimedCellPositioning.ts` with a private constructor, `static create()`, and a `selectPosition` scanning `y` outer / `x` inner and returning the first `(x, y)` where `grid[y][x] === playerId`, throwing `RangeError('player has no claimed cells')` after a full scan finds none. Row-major order is what makes "first claimed cell" well-defined, since `StartingPattern` exposes no ordering of its own.
4. Create `src/simulation/player/RandomClaimedCellPositioning.ts` with a private constructor storing `random: () => number`, `static create(random?: () => number)` defaulting to `Math.random`, and a `selectPosition` collecting every matching cell into an array and returning `cells[Math.floor(this.random() * cells.length)]`, throwing the same `RangeError` for an empty array. Injecting the generator matches `selectRandomPresetIndices` and is what lets the test assert an exact cell.
5. Export all four names from `src/simulation/player/index.ts` and re-export from `src/simulation/index.ts`.
6. Create `tests/simulation/player/FirstClaimedCellPositioning.test.ts` (first cell in row-major order for a player with several cells; a player whose only cell is the last cell of the grid; `RangeError` for a player with no cells) and `tests/simulation/player/RandomClaimedCellPositioning.test.ts` (a stub generator returning `0` picks the first collected cell; one returning `0.999…` picks the last; each returned cell is genuinely owned by the player; `RangeError` for a player with no cells).

**Post-condition**: Both positioning strategies exist and are tested in isolation against a hand-built grid. `Simulation` still has no positions.

**Dependencies**: Phase 1 (uses `GridPosition` in the already-declared `GenerationContext`).

### Phase 3 — Teach Simulation to hold positions, move players, and delegate its sweep

**Pre-condition**: Phases 1 and 2 are complete. `Simulation.run()` still contains the double loop, and `SimulationOptions` has no `mode` field.

**Steps**:
1. In `src/simulation/SimulationOptions.ts`, add `readonly mode: SimulationMode`, a trailing optional `mode?: SimulationMode` parameter on `create`, and `const resolvedMode = mode ?? GlobalSimulationMode.create()`. A trailing optional parameter with a global-mode default keeps every existing `SimulationOptions.create` call site behaving exactly as it does now.
2. In `src/simulation/Simulation.ts`, add `private readonly mode: SimulationMode` assigned from `options.mode`, and `private readonly positions: Map<number, GridPosition>` initialised empty.
3. Replace the double loop in `run()` with `const nextGrid = this.mode.nextGeneration({ grid: this.grid, players: this.players, generation: this.generation, positions: this.positions, cellClaim: this.cellClaim })`, leaving the `this.grid = nextGrid`, generation increment and score accumulation that follow untouched. The generation passed is still the one being read, preserving the comment's contract for generation-varying claim strategies.
4. Add `public applyStartPositioning(strategy: StartPositioningStrategy): void` which clears `positions` and sets one entry per player from `strategy.selectPosition(this.grid, player.id)`. It must be called after `applyStartingPattern`, since both strategies read owned cells off the seeded grid.
5. Add `public getPlayerPosition(playerId: number): GridPosition | undefined` returning the stored position, and `public movePlayer(playerId: number, dx: number, dy: number): boolean` which returns `false` when the player has no position, computes the target with `wrapCoordinate(current + delta, width/height)` so movement wraps like the toroidal rules already do, returns `false` when `this.grid[targetY][targetX]` is neither `null` nor `playerId`, and otherwise stores the new position and returns `true`.
6. Update `tests/simulation/Simulation.test.ts` with: `run()` calls the injected mode and adopts its returned grid; `applyStartPositioning` assigns one position per registered player; `movePlayer` onto an unclaimed cell succeeds; onto own cell succeeds; onto a cell owned by another player returns `false` and leaves the position unchanged; stepping off the left edge wraps to the right edge.

**Post-condition**: A `Simulation` can be constructed with either mode, holds a position per player, and rejects illegal moves. Global-mode behaviour is unchanged and the existing suite still passes.

**Dependencies**: Phases 1 and 2.

### Phase 4 — Implement the player local sweep

**Pre-condition**: Phase 3 is complete, so a mode receives a populated `positions` map. `PlayerLocalSimulationMode` does not exist yet.

**Steps**:
1. Create `src/simulation/mode/PlayerLocalSimulationMode.ts` with a private constructor and `static create()`.
2. In `nextGeneration`, allocate an all-`null` grid, then make one pass over `context.grid` bucketing each non-null cell into a `Map<number, GridPosition[]>` keyed by owner. Starting from an all-`null` grid is equivalent to "cells outside every player's evaluated set keep their value", because a cell's value *is* its owner: every non-null cell belongs to exactly one player's bucket, so the only untouched cells are the ones already empty.
3. For each player in roster order, resolve that player's bucket plus `context.positions.get(player.id)` — deduplicating when the player stands on a cell it already owns — by calling `context.cellClaim.resolve(context.grid, x, y, [player], context.generation)`. Passing a single-element array is what restricts evaluation to that player's own rules while reusing `CellClaim` unchanged, so the OR-combination of a player's rules and the candidate-building logic are not duplicated.
4. Skip writing to a cell already written this generation by an earlier player, so a cell contested by two players resolves to the first in roster order. This can only arise when one player steps onto a cell another player occupies after that cell has died, and matching `FirstMatchClaimStrategy`'s tie-break keeps the rule consistent with the project's default.
5. Export the class from `src/simulation/mode/index.ts` and `src/simulation/index.ts`.
6. Create `tests/simulation/mode/PlayerLocalSimulationMode.test.ts` asserting: a cell owned by player A survives or dies purely by A's rules; an empty cell far from every player and position stays empty even when a player's rule would match it; the cell a player occupies is evaluated even when unowned; a cell owned by A is never taken over by B whose rules match it; and two players sharing a cell resolve to the earlier player in roster order.

**Post-condition**: Both modes implement `SimulationMode` and are independently tested against the same interface. Nothing in the GUI can select the new mode yet.

**Dependencies**: Phases 1–3.

### Phase 5 — Select the mode on the configuration screen and carry it through

**Pre-condition**: Phase 4 is complete. `GameConfigurationScreen.onStartGame` still takes `(level, selected)` and `Level.createSimulation` takes `(humanRules, hiScore)`.

**Steps**:
1. In `src/simulation/level/Level.ts`, widen `createSimulation` to `(humanRules, mode?, startPositioning?, hiScore?)`, pass `mode` to `SimulationOptions.create`, and call `simulation.applyStartPositioning(startPositioning)` after `applyStartingPattern` when one is supplied. Update `tests/simulation/level/Level.test.ts` to cover both the defaulted and the fully specified call.
2. Create `src/gui/AvailableSimulationModes.ts` and `src/gui/AvailableStartPositionings.ts` as `ReadonlyArray` catalogues of `{ name, description, ... }` options, matching `AVAILABLE_CLAIM_STRATEGIES`, with the mode option also carrying `requiresStartPositioning`. Add `tests/gui/AvailableSimulationModes.test.ts` and `tests/gui/AvailableStartPositionings.test.ts` asserting each entry has a non-empty name and a usable instance.
3. Create `src/gui/GameConfiguration.ts` declaring the `GameConfiguration` interface (`level`, `presets`, `mode`, `startPositioning`), so the three screen-to-screen signatures stop growing one parameter per configuration option.
4. In `src/gui/screens/GameConfigurationScreen.ts`, add the "Game mode" `<select>` above the level controls and a "Player positioning" `<select>` shown only while the selected mode's `requiresStartPositioning` is true, reusing the existing `buildOptionSelect` helper and the `style.display` toggle already used by the custom-level controls. Change `onStartGame` to take one `GameConfiguration`, built in the start-button handler with `startPositioning` set to `null` for global mode.
5. In `src/gui/GameController.ts` and `src/gui/screens/GamePlayingScreen.ts`, replace the `(level, presets)` pair with the single `GameConfiguration`, and pass `configuration.mode` and `configuration.startPositioning ?? undefined` into `level.createSimulation`.

**Post-condition**: A player can select player local simulation on the configuration screen and start a game whose generations use the local sweep, with positions assigned by the selected strategy. The game is not yet controllable or visible.

**Dependencies**: Phases 1–4.

### Phase 6 — Wire keyboard control and render the occupied cells

**Pre-condition**: Phase 5 is complete, so a running game holds positions but nothing reads or draws them. No keyboard listener exists anywhere in the project.

**Steps**:
1. Create `src/gui/PlayerInputController.ts` with a private constructor storing `simulation` and `playerId`, `static create(simulation, playerId)`, and `attach()` / `detach()` adding and removing one `keydown` listener on `window`. `attach` must be idempotent so a second call cannot register a duplicate listener.
2. In the handler, lower-case `event.key` and map `a` → `movePlayer(id, -1, 0)`, `d` → `(+1, 0)`, `w` → `(0, -1)`, `x` → `(0, +1)`, calling `event.preventDefault()` only for a handled key so unrelated keys still reach the browser. `y` decreases upward because row 0 is the top row, as `SimulationRenderer.initThree` already assumes. `p` is deliberately not bound — see Additional Notes.
3. In `src/gui/screens/GamePlayingScreen.ts`, create and `attach()` a `PlayerInputController` for `HUMAN_PLAYER_ID` in `show` when `configuration.startPositioning !== null`, and `detach()` it in both `hide()` and `handleGameOver()` alongside the existing overlay teardown, so no listener survives a finished or abandoned game.
4. In `src/gui/SimulationRenderer.ts`, add `POSITION_PULSE_PERIOD_MS` and a `POSITION_PULSE_COLOR` of white. After the existing grid loop in `render()`, compute `blend = (Math.sin((performance.now() / POSITION_PULSE_PERIOD_MS) * 2 * Math.PI) + 1) / 2` once per frame, then for each player position set that mesh's colour to the player's colour lerped toward white by `blend` via `THREE.Color.lerpColors`. `performance.now()` is used rather than `frameCount` so the pulse period does not change when the player changes simulation speed.
5. Read positions through a new `Simulation.getPlayerPositions(): ReadonlyMap<number, GridPosition>` accessor rather than the grid, so the renderer stays a pure reader of simulation state.
6. Create `tests/integration/PlayerLocalGame.test.ts` starting `LEVEL_ONE` in player local mode with `FirstClaimedCellPositioning`, asserting: every player receives a position inside a cell it owns at generation 0; after several generations no cell has changed owner from one player to another; and a `movePlayer` onto an unclaimed cell followed by a generation can bring that cell to life while the rest of the grid is unaffected.

**Post-condition**: A player local game is fully playable — the human walks the grid with `W`/`A`/`X`/`D`, every occupied cell pulses between its player's colour and white, and no listener or timer leaks when the game ends.

**Dependencies**: Phases 1–5.

## Testing

### TypeScript unit tests

All test work below is planned, not written. No test file in this PR exists yet.

- **`tests/simulation/mode/GlobalSimulationMode.test.ts`** *(new)* — Behaviour-preservation of the extracted sweep. Status: **not run — not implemented**.
- **`tests/simulation/mode/PlayerLocalSimulationMode.test.ts`** *(new)* — Evaluation scope, no cross-player takeover, occupied-cell evaluation, roster-order tie-break. Status: **not run — not implemented**.
- **`tests/simulation/player/FirstClaimedCellPositioning.test.ts`** *(new)* — Row-major first cell, last-cell edge case, `RangeError` for a player with no cells. Status: **not run — not implemented**.
- **`tests/simulation/player/RandomClaimedCellPositioning.test.ts`** *(new)* — Deterministic selection under a stubbed generator at both ends of the range, plus the same `RangeError` path. Status: **not run — not implemented**.
- **`tests/simulation/Simulation.test.ts`** *(updated)* — Mode delegation, `applyStartPositioning`, and the four `movePlayer` paths including edge wrapping. Status: **not run — not implemented**.
- **`tests/simulation/level/Level.test.ts`** *(updated)* — `createSimulation` with and without the new optional arguments. Status: **not run — not implemented**.
- **`tests/gui/AvailableSimulationModes.test.ts`**, **`tests/gui/AvailableStartPositionings.test.ts`** *(new)* — Catalogue shape, matching the existing `AvailableClaimStrategies` test. Status: **not run — not implemented**.
- **`tests/integration/PlayerLocalGame.test.ts`** *(new)* — End-to-end level → local mode → generations. Status: **not run — not implemented**.

- [ ] Unit tests added/updated — planned, not written
- [ ] Integration tests added/updated — planned, not written
- [ ] All tests passing (`npm run test`) — not run

**Test coverage**: current suite is 271 tests across 30 files. The plan adds roughly 25 tests in 7 new files and 2 updated ones. `PlayerInputController` and `SimulationRenderer` remain untested by unit tests, matching the project's existing treatment of DOM- and WebGL-bound classes; both are covered by the manual steps below.

### Validation evidence

| Command | Result |
|---------|--------|
| `npm run lint` | not run — no code changes to lint |
| `npm run typecheck` | not run — no code changes to check |
| `npm run test` | not run — no test changes; baseline is 271/271 as of #21 |
| `npm run build` | not run — no code changes to build |

### Manual validation steps

| # | Check | How to verify |
|---|-------|---------------|
| 1 | Global simulation is unchanged | `npm run dev`, leave "Game mode" at "Global simulation", start a game, and confirm the grid evolves exactly as before and no positioning picker is shown. |
| 2 | The positioning picker appears only for the new mode | Switch "Game mode" to "Player local simulation" and confirm the "Player positioning" select appears; switch back and confirm it disappears. |
| 3 | Start positions land inside claimed territory | Start a player local game with "First claimed cell" and confirm each pulsing cell sits inside a block of its own colour, at that block's top-left-most cell. |
| 4 | Random positioning varies between games | Start two player local games with "Random claimed cell" and confirm the human's pulsing cell is at a different point within its own territory each time. |
| 5 | Movement keys work and respect the legality rule | Press `A`, `D`, `W`, `X` and confirm the pulsing cell steps one cell left/right/up/down per press, that it walks freely over its own and empty cells, and that it refuses to enter a cell of another player's colour. |
| 6 | Movement wraps at the grid edges | Hold `A` until the marker reaches the left edge and confirm the next press places it at the right edge on the same row. |
| 7 | No cross-player takeover occurs | Run a player local game for a minute and confirm no cell ever changes from one player's colour directly to another's. |
| 8 | Territory decays and the game ends | Run a player local game at speed 1 and confirm cell counts trend down and the game-over screen eventually appears. |
| 9 | The pulse is speed-independent | Change the simulation speed during a player local game and confirm the marker's pulse rate does not change. |
| 10 | No input listener leaks | Exit to the title screen mid-game, then press `A`/`D` and confirm nothing happens; start a second game and confirm the keys work again. |

## Documentation Plan

| File | Changes |
|------|---------|
| `README.md` | Add a "Game modes" section under "Browser GUI" describing global simulation (all cells swept every generation) and player local simulation (a player's rules applied only to its owned cells and the cell it occupies, so territory cannot be taken from another player). Extend "In-game controls" with the `W`/`A`/`X`/`D` movement keys, the legality rule, and edge wrapping. Extend the configuration-screen description with the game-mode and player-positioning pickers, naming both positioning strategies. |
| `.github/.requirements/pr/22-player-local-simulation-mode.md` | This document. |

## Related Issues
Closes #22

## Checklist
- [ ] Code follows project conventions (static factory methods, private constructors, `create` validation) — planned throughout, not yet written
- [ ] TypeScript types are correct (`npm run typecheck` passes) — not run
- [ ] Code lints without errors (`npm run lint` passes) — not run
- [ ] All tests pass (`npm run test` passes) — not run
- [ ] Build succeeds (`npm run build` passes) — not run
- [ ] JSDoc comments added for public APIs — planned for every new interface, class and public method
- [x] Updated documentation (if applicable) — `README.md` changes specified in the Documentation Plan
- [x] No breaking changes (or documented in PR description) — the three GUI signature changes are documented under Type of Change
- [ ] Commit messages follow Conventional Commits format — no commits yet

## Additional Notes

### Design decisions taken in the `grill-me` interview

1. **Evaluation scope** — A generation evaluates exactly each player's owned cells plus the cell it occupies. This is the literal reading of the requirement and has two consequences worth reviewing before the code is written: a player can never birth a cell into empty space except by standing on it, so territory only decays; and no cell is ever a candidate for two players, so **the claim strategy selected on the configuration screen has no effect in player local simulation mode**. The picker is left in place because the requirement asks for the same configuration choices in both modes.
2. **Mode as an injected strategy** — `SimulationMode` mirrors the `ClaimStrategy` precedent and keeps `Simulation` closed for modification, rather than a subclass or a mode flag branched on inside `run()`.
3. **Positions owned by `Simulation`** — move legality has to read the grid, which only `Simulation` holds. Positions are deliberately not on `Player`, whose computer instances are shared across games.
4. **Immediate movement** — a keypress moves the player at once rather than being queued to a generation boundary. This is self-limiting: since only the cell occupied at tick time is evaluated, pressing keys rapidly between ticks confers no advantage.
5. **Computer players do not move** — the requirement defines no AI movement, so none is invented. **Risk**: combined with decision 1, a stationary player can only ever gain the one cell it stands on, so the three computer players decay steadily while the human can hold ground, and the human wins on cumulative score by default. A `PlayerMovement` strategy family is the natural follow-up.
6. **Positioning reads the seeded grid** — strategies take `(grid, playerId)` rather than requiring `StartingPattern` to grow an enumeration method for one caller. "First claimed cell" therefore means first in row-major order, and it is that *player's* first claimed cell — a single global first cell would stack every player on one square, which the movement rule forbids.
7. **`P` is not bound** — the requirement names `P` as an action key but never defines the action, and no verb is invented here. **Risk**: the mode ships with a knowingly incomplete control scheme. Deciding `P`'s verb is the first follow-up.
8. **Occupied cells pulse** — every occupied cell oscillates between its player's colour and white. A static marker in the player's own colour would be invisible at generation 0, since both positioning strategies place a player inside its own territory.

### Open questions and follow-up work

- What does `P` do? Claiming the occupied cell is the obvious candidate and would give the player direct agency over the one cell the rules evaluate for them.
- Should computer players move? Without it the mode is not a contest; a `PlayerMovement` strategy with a random-walk implementation is the smallest thing that fixes it.
- Should the claim-strategy picker be hidden in player local simulation mode, given it cannot fire there?
- Two players can share a cell only when one steps onto another's position after that cell has died; the roster-order tie-break in Phase 4 covers it, but the movement rule could forbid it outright instead.
- Game-over is still "no living cells anywhere". A player that keeps a position but owns no cells is currently just a player with a score of zero, not an eliminated one.
