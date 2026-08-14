# feat(simulation): introduce levels with deterministic starting patterns

## Summary

Introduces a `Level` as the unit that defines the start of a game: the grid dimensions, the starting pattern written into the grid, the four participants, and the three rules each of the three computer players begins with. Adds Level 1, whose starting pattern is a repeating checker of 10×10-cell blocks cycling through player 1, 2, 3, 4, and an empty block. The human player still chooses their own three rules on the configuration screen, so a run is reproducible for any given selection.

## Motivation

A game currently has no reproducible starting point. `GamePlayingScreen.show` calls `simulation.seedRandom(...)` once per participant, which fills the grid through `Math.random()`, and `createGameParticipants` draws each computer player's three rules at random through `selectRandomPresetIndices(..., Math.random)`. Two consecutive games therefore differ in both the initial grid and three of the four rule sets, so a run cannot be repeated, compared, or reasoned about: a grid that dies in 12 generations cannot be distinguished from one that dies in 400 because of the rules rather than the seed. There is also no concept that owns "how a game begins" — the starting configuration is scattered across a screen class, a participant factory, and two separate `Math.random()` call sites.

This PR gives that configuration a name and a home. A level is a value object in the simulation layer holding the starting pattern and the roster, so a game start becomes data rather than a sequence of randomised side effects, and adding Level 2 later means adding a definition rather than editing a screen. The human's rule choice stays where the player makes it — on the configuration screen — and becomes the single remaining input that varies between runs.

## Changes

### Files Deleted

- None

### Files Updated

- **`src/simulation/level/StartingPattern.ts`** *(new file)* — `StartingPattern` interface with a single method `cellAt(x: number, y: number): Cell`, returning the player id that owns the cell at generation 0 or `null` for an empty cell. Declaring the pattern as a pure coordinate → `Cell` function, rather than a pre-built grid, keeps a pattern independent of the grid size it is applied to.
- **`src/simulation/level/CheckerStartingPattern.ts`** *(new file)* — `CheckerStartingPattern implements StartingPattern`, with a private constructor and `static create(blockSize: number, sequence: ReadonlyArray<Cell>): CheckerStartingPattern`. `cellAt` computes `blockX = Math.floor(x / blockSize)`, `blockY = Math.floor(y / blockSize)`, and returns `sequence[(blockX + blockY) % sequence.length]`. Summing the two block indices is what makes the sequence repeat along both axes, as required, instead of producing vertical stripes. `create` throws `RangeError` when `blockSize` is not a positive integer or when `sequence` is empty, and stores a copy of the sequence so a caller mutating the array it passed in cannot change an existing pattern.
- **`src/simulation/level/HumanPlayerSlot.ts`** *(new file)* — `HumanPlayerSlot` interface holding the human participant's `readonly id: number` and `readonly name: string`, but no rules. This is the type that encodes the central asymmetry of a level: the level fixes *who* the human player is and which checker blocks they own, while the human chooses *how* they play.
- **`src/simulation/level/LevelRoster.ts`** *(new file)* — `LevelRoster` interface pairing `readonly human: HumanPlayerSlot` with `readonly computers: ReadonlyArray<Player>`. Bundling the two keeps `Level.create` at six parameters instead of seven, and names the asymmetry rather than leaving it implicit in the argument order.
- **`src/simulation/level/Level.ts`** *(new file)* — `Level` class with a private constructor and `static create(id, name, width, height, roster, startingPattern)`. Exposes readonly `id`, `name`, `width`, `height`, `roster`, and `startingPattern`, plus:
  - `createPlayers(humanRules: Rule[]): Player[]` — returns `[{ id, name, rules: humanRules }, ...roster.computers]`, the human first so scoreboard order is unchanged.
  - `createSimulation(humanRules: Rule[], hiScore?: HiScore): Simulation` — builds the roster via `createPlayers`, passes it to `SimulationOptions.create(width, height, players, hiScore)`, constructs the `Simulation`, applies the starting pattern, and returns it.

  `create` throws `RangeError` for a non-positive `width`/`height` or an empty `computers` array, and `Error` when two players share an id, counting the human slot — a duplicate id would make a checker block's owner ambiguous. `createSimulation` throws `RangeError` when `humanRules` is empty, since a player with no rules can never claim a cell.
- **`src/simulation/level/LevelOne.ts`** *(new file)* — Builds and exports the `LEVEL_ONE` constant: a 100×100 grid, the roster below, and `CheckerStartingPattern.create(10, [1, 2, 3, 4, null])`. Computer rules are constructed as `SumRule` instances directly rather than imported from `src/gui/AvailableRulePresets.ts`, so the simulation layer keeps no dependency on the GUI layer.
  | id | Name | Rules |
  |----|------|-------|
  | 1 | `Player 1` | Chosen by the human on the configuration screen — not defined by the level |
  | 2 | `Computer 1` | `SumRule([3])`, `SumRule([2, 3], true)`, `SumRule([3, 4], true)` |
  | 3 | `Computer 2` | `SumRule([1])`, `SumRule([1], true)`, `SumRule([2, 3])` |
  | 4 | `Computer 3` | `SumRule([1, 2])`, `SumRule([4, 5], true)`, `SumRule([2, 3], true)` |

  The human slot's name is `'Player 1'`, matching the existing `HUMAN_PLAYER_NAME` constant so hi-score entries are unchanged.
- **`src/simulation/level/index.ts`** *(new file)* — Barrel exporting `Level`, `CheckerStartingPattern`, `LEVEL_ONE`, and the `StartingPattern`, `HumanPlayerSlot`, and `LevelRoster` types, matching the `src/simulation/player/index.ts` and `src/simulation/hiscore/index.ts` convention.
- **`src/simulation/Simulation.ts`** — Adds `public applyStartingPattern(pattern: StartingPattern): void`, which overwrites every cell of the grid with `pattern.cellAt(x, y)` and resets `generation` to `0`. Unlike `seedRandom`, it assigns rather than skips occupied cells, so applying a pattern always yields the same grid regardless of what the grid held before. Also adds `public getPlayers(): ReadonlyArray<Player>` returning the private `players` field, so the GUI can build its participant list from the exact `Player` objects the simulation is running rather than a second, separately constructed set. `seedRandom` is left in place, still used by non-level callers and its existing tests.
- **`src/simulation/index.ts`** — Re-exports `Level`, `CheckerStartingPattern`, `LEVEL_ONE`, and the three new types from `./level`.
- **`src/gui/GameParticipants.ts`** — Adds `export function createLevelParticipants(players: ReadonlyArray<Player>): GameParticipant[]`, which pairs each player with a colour looked up by id from a new `PLAYER_COLORS: ReadonlyMap<number, number>` built from the existing `HUMAN_PLAYER_COLOR` and `COMPUTER_PLAYER_COLORS` values, so Level 1 keeps today's red/blue/green/yellow scheme. Taking players rather than a `Level` lets the caller pass `simulation.getPlayers()`, keeping one set of `Player` objects in play. Colour stays in the GUI layer because it is a rendering concern the simulation has no use for. The existing `createGameParticipants` and `selectRandomRules` are left unchanged for the non-level path.
- **`src/gui/screens/GamePlayingScreen.ts`** — `show` changes signature from `show(selectedPresets: RulePreset[])` to `show(level: Level, selectedPresets: RulePreset[])`. It maps the presets to `Rule[]`, calls `level.createSimulation(humanRules)` in place of the `SimulationOptions.create` / `Simulation.create` pair, and builds participants with `createLevelParticipants(simulation.getPlayers())` instead of `createGameParticipants(selectedPresets)`. The `for (const player of players) simulation.seedRandom(...)` loop is deleted — the level's starting pattern replaces it, removing the grid-seeding `Math.random()` calls from game start. The `GRID_WIDTH`, `GRID_HEIGHT`, and `PLAYER_SEED_DENSITY` constants are removed because the level now owns the dimensions and the initial occupancy. `RulePreset` stays imported, as does `Simulation` — it is still the type of the private `simulation` field; `SimulationOptions` is dropped and `Level` is added.
- **`src/gui/GameController.ts`** — `handleStartGame(selectedPresets)` calls `this.gamePlayingScreen.show(LEVEL_ONE, selectedPresets)`, forwarding the human's choice unchanged. Adds a `LEVEL_ONE` import from `../simulation`; the `RulePreset` import is retained.
- **`tests/simulation/level/CheckerStartingPattern.test.ts`** *(new file)* — Covers block resolution, both-axis repetition, the empty phase, realignment at the 100-cell boundary, and the `create` validation failures.
- **`tests/simulation/level/Level.test.ts`** *(new file)* — Covers the accessors, `createPlayers` roster assembly and ordering, `createSimulation` producing a grid matching the pattern at generation 0, and every `create` / `createSimulation` validation failure.
- **`tests/simulation/level/LevelOne.test.ts`** *(new file)* — Asserts Level 1's fixed shape: 100×100, human slot id 1, three computers with ids 2–4 holding exactly three rules each, and the checker's corner cells.
- **`tests/simulation/Simulation.test.ts`** — Adds an `applyStartingPattern` block (pattern is written to every cell, occupied cells are overwritten, empty phases clear a cell, `generation` resets to `0`) and a `getPlayers` block.
- **`tests/integration/LevelOneGame.test.ts`** *(new file)* — End-to-end coverage of the path the game screen takes: level → simulation → generations → hi-score. Automates the manual browser checks that do not depend on rendering; see the Testing section for the mapping.
- **`tests/gui/GameParticipants.test.ts`** *(new file)* — Covers `createLevelParticipants`: Level 1's four players map to the four distinct scoreboard colours in roster order, the `Player` objects pass through by reference, and an id outside the palette falls back to `DEFAULT_PLAYER_COLOR`.
- **`README.md`** — Adds a "Levels" section describing what a level defines, the Level 1 checker layout, and the exact scope of the determinism guarantee.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [x] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [x] Documentation update
- [ ] Performance improvement
- [x] Test coverage improvement

`GamePlayingScreen.show` gains a parameter; the break is internal to `src/`, and is called out under Additional Notes.

## Implementation Plan

### Phase 1 — Introduce the `StartingPattern` abstraction and the checker implementation

**Pre-condition**: `src/simulation/` contains no notion of an initial grid state; the only way to populate a grid is `Simulation.seedRandom`. No dependencies on other phases.

**Steps**:
1. Create `src/simulation/level/StartingPattern.ts` declaring `export interface StartingPattern { cellAt(x: number, y: number): Cell }`, importing `Cell` from `../Cell`. A coordinate-addressed interface is chosen over a pre-built `Grid` so one pattern instance can be applied to any grid size and so `Level` never has to allocate a second grid.
2. Create `src/simulation/level/CheckerStartingPattern.ts` with a private constructor taking `blockSize: number` and `sequence: ReadonlyArray<Cell>`, both stored as readonly fields, and a `public static create(blockSize, sequence)` factory following the project's factory convention.
3. In the same file, implement `cellAt(x, y)` as `this.sequence[(Math.floor(x / this.blockSize) + Math.floor(y / this.blockSize)) % this.sequence.length]`. Adding the two block indices before the modulo is what produces the required repetition along *both* axes — using `blockX` alone would repeat horizontally only.
4. In `create`, throw `RangeError('blockSize must be a positive integer')` when `blockSize` is not a positive integer and `RangeError('sequence must not be empty')` for an empty sequence, so an invalid pattern fails at construction rather than producing `undefined` cells during a run.
5. Create `tests/simulation/level/CheckerStartingPattern.test.ts` asserting: all 100 cells of the block at `(0,0)`–`(9,9)` return the first sequence entry; `cellAt(10, 0)` and `cellAt(0, 10)` both return the second entry; the fifth phase returns `null`; `cellAt(50, 0)` returns the first entry again (block index 5, `5 % 5 === 0`); and both `create` failures throw.

**Post-condition**: `CheckerStartingPattern` is a standalone, tested value object; nothing constructs or consumes it yet.

### Phase 2 — Add the `Level` type and define Level 1

**Pre-condition**: Phase 1 is complete — `StartingPattern` and `CheckerStartingPattern` compile from `src/simulation/level/`. `Simulation` cannot yet apply a pattern and does not expose its players.

**Steps**:
1. In `src/simulation/Simulation.ts`, add `public applyStartingPattern(pattern: StartingPattern): void` that loops `y` then `x` over the full grid assigning `this.grid[y][x] = pattern.cellAt(x, y)` and then sets `this.generation = 0`. Assignment is unconditional — unlike `seedRandom`, which skips occupied cells — because a level start must not depend on prior grid content. Import the `StartingPattern` type from `./level/StartingPattern`.
2. In the same file, add `public getPlayers(): ReadonlyArray<Player>` returning `this.players`. This is what lets the GUI build its scoreboard from the simulation's own player objects in Phase 3, instead of constructing a parallel set that could drift.
3. Create `src/simulation/level/HumanPlayerSlot.ts` (`readonly id`, `readonly name`) and `src/simulation/level/LevelRoster.ts` (`readonly human: HumanPlayerSlot`, `readonly computers: ReadonlyArray<Player>`). Two files rather than one inline type, matching the project's one-type-per-file convention.
4. Create `src/simulation/level/Level.ts` with a private constructor, readonly fields `id`, `name`, `width`, `height`, `roster`, `startingPattern`, and `public static create(id, name, width, height, roster, startingPattern)`.
5. In `create`, throw `RangeError` when `width` or `height` is not positive, throw `RangeError('computers must not be empty')` for an empty computer roster, and throw `Error('player ids must be unique')` when the human id and the computer ids do not form a set of the same length. The uniqueness check matters because the starting pattern addresses players by id, so two players sharing an id would make a checker block's owner ambiguous.
6. In the same file, add `public createPlayers(humanRules: Rule[]): Player[]` returning `[{ id: this.roster.human.id, name: this.roster.human.name, rules: humanRules }, ...this.roster.computers]`. Human first preserves the existing scoreboard order. Throw `RangeError('humanRules must not be empty')` here, so both entry points below are covered by one check.
7. In the same file, add `public createSimulation(humanRules: Rule[], hiScore?: HiScore): Simulation` that calls `this.createPlayers(humanRules)`, passes the result to `SimulationOptions.create(this.width, this.height, players, hiScore)` and `Simulation.create`, calls `applyStartingPattern(this.startingPattern)` on the result, and returns it. The optional `hiScore` passthrough lets tests inject an isolated list, matching the pattern established in `SimulationOptions`.
8. Create `src/simulation/level/LevelOne.ts` exporting `LEVEL_ONE = Level.create(1, 'Level 1', 100, 100, roster, CheckerStartingPattern.create(10, [1, 2, 3, 4, null]))`, with the human slot `{ id: 1, name: 'Player 1' }` and the three computer players and their fixed three-rule sets from the Files Updated table, built from `SumRule` directly. Define the block size, the sequence, and the grid dimensions as named module constants (`CHECKER_BLOCK_SIZE`, `CHECKER_SEQUENCE`, `GRID_WIDTH`, `GRID_HEIGHT`) rather than inline literals.
9. Create `src/simulation/level/index.ts` exporting `Level`, `CheckerStartingPattern`, `LEVEL_ONE`, and the three types, and re-export them from `src/simulation/index.ts`.
10. Add `tests/simulation/level/Level.test.ts` and `tests/simulation/level/LevelOne.test.ts` per the Testing section, and extend `tests/simulation/Simulation.test.ts` with the `applyStartingPattern` and `getPlayers` cases.

**Post-condition**: `LEVEL_ONE.createSimulation(rules)` returns a 100×100 simulation at generation 0 whose grid is the checker pattern, with the human holding `rules` and three computers holding their fixed sets. The GUI does not use it yet.

### Phase 3 — Start games from a level while keeping the human's rule selection

**Pre-condition**: Phases 1 and 2 are complete. `GamePlayingScreen.show` still takes only `RulePreset[]`, calls `seedRandom` four times, and gets three of its four rule sets from `Math.random()`.

**Steps**:
1. In `src/gui/GameParticipants.ts`, extract the existing `HUMAN_PLAYER_COLOR` and `COMPUTER_PLAYER_COLORS` values into a `PLAYER_COLORS: ReadonlyMap<number, number>` keyed by player id (`1 → 0xff0000`, `2 → 0x0080ff`, `3 → 0x00cc44`, `4 → 0xffcc00`), so a colour can be resolved from a player without assuming roster order.
2. In the same file, add `export function createLevelParticipants(players: ReadonlyArray<Player>): GameParticipant[]` returning `players.map((player) => ({ player, color: PLAYER_COLORS.get(player.id) ?? DEFAULT_PLAYER_COLOR }))`, with `DEFAULT_PLAYER_COLOR` a named constant covering ids a future level may add. Leave `createGameParticipants` and `selectRandomRules` untouched — this phase adds a level path, it does not delete the preset path.
3. In `src/gui/screens/GamePlayingScreen.ts`, change `show(selectedPresets: RulePreset[])` to `show(level: Level, selectedPresets: RulePreset[])`, and open the method with `const humanRules = selectedPresets.map((preset) => preset.rule);` — the same mapping `createGameParticipants` performs today, moved to the call site because the level now assembles the roster.
4. In the same method, replace the `createGameParticipants` / `SimulationOptions.create` / `Simulation.create` sequence with `const simulation = level.createSimulation(humanRules);` followed by `const participants = createLevelParticipants(simulation.getPlayers());`. Ordering matters: participants are derived from the simulation, not built alongside it, so the scoreboard and the renderer colour map can never disagree with the running roster.
5. In the same method, delete the `for (const player of players) { simulation.seedRandom(PLAYER_SEED_DENSITY, player.id); }` loop and the now-unused `GRID_WIDTH`, `GRID_HEIGHT`, and `PLAYER_SEED_DENSITY` constants. This is the change that removes non-determinism from the grid: the level's pattern has already populated it inside `createSimulation`. Leave the `GuiOptions`, renderer, scoreboard, and speed-control wiring below it untouched, since it consumes `participants` and is unaffected.
6. In `src/gui/GameController.ts`, change `handleStartGame` to call `this.gamePlayingScreen.show(LEVEL_ONE, selectedPresets)` and add the `LEVEL_ONE` import from `../simulation`. The `selectedPresets` parameter and the `RulePreset` import stay — the configuration screen remains the source of the human's rules.
7. Extend `tests/simulation/Simulation.test.ts` with the determinism case: build two simulations from `LEVEL_ONE` using an identical `humanRules` array and separate injected `HiScore.create()` instances, call `run()` 25 times on each, and assert `getGrid()` and `getCellCounts()` are deeply equal. This is the test that would fail if any `Math.random()` were reintroduced into the level start path.
8. Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.

**Post-condition**: Pressing "Start game" runs Level 1 from the checker pattern, with the human's chosen rules and the level's fixed computer rules. Two runs with the same selection produce identical generations.

### Phase 4 — Document levels

**Pre-condition**: Phase 3 is complete and the build is green. `README.md` describes the rule presets and in-game controls but has no notion of a level.

**Steps**:
1. In `README.md`, add a "Levels" section after "In-game controls" stating the four things a level fixes — grid dimensions, starting pattern, participants, and each computer player's three starting rules — and the one thing it deliberately does not: the human player's rules.
2. In the same section, add a "Level 1" subsection with a small ASCII excerpt of the block layout and a table of the four participants, so a reader can predict the opening grid without reading `LevelOne.ts`.
3. Add a "Determinism" paragraph stating the guarantee precisely: given the same three rules chosen on the configuration screen, a level run is reproducible generation for generation; and note that `simulation.seedRandom` is retained for non-level use and is *not* used by a level start, so the claim is not read as applying to the whole class.

**Post-condition**: `README.md` documents what a level is, what Level 1 contains, and the determinism guarantee with its exact boundary.

## Testing

### TypeScript unit tests

- `tests/simulation/level/CheckerStartingPattern.test.ts` *(new)* — block resolution within a 10×10 block; repetition on both axes (`cellAt(10, 0) === cellAt(0, 10)`); the fifth phase yielding `null`; the sequence realigning at block index 5; `create` rejecting a non-positive `blockSize` and an empty `sequence`.
- `tests/simulation/level/Level.test.ts` *(new)* — accessors return the constructor values; `createPlayers` puts the human first with the supplied rules and appends the computers unchanged; `createSimulation` returns a simulation at generation 0 whose grid equals the pattern; the injected `HiScore` is the one recorded into; `create` throws for non-positive width, non-positive height, empty computers, and an id collision between the human slot and a computer; `createPlayers` and `createSimulation` throw for empty `humanRules`.
- `tests/simulation/level/LevelOne.test.ts` *(new)* — Level 1 is 100×100; the human slot is id 1 / `Player 1`; computer ids are exactly `[2, 3, 4]`; every computer has exactly three rules; `cellAt(0, 0) === 1` and `cellAt(40, 0) === null`.
- `tests/simulation/Simulation.test.ts` *(updated)* — `applyStartingPattern` writes every cell, overwrites already-occupied cells, clears a cell an empty phase covers, and resets `generation` to `0`; `getPlayers` returns the roster passed through options and an empty list when none are registered.
- `tests/integration/LevelOneGame.test.ts` *(new)* — plays level 1 end to end through the public API. Opening grid: the first block is entirely the human's, the checker advances on both axes, every fifth block is empty (2,000 empty cells), all four participants open on 2,000 cells, generation is 0. Determinism: two runs with equal human rules match on grid, cell counts, and generation after 25 generations. Human selection: two different selections diverge by generation 10; a human whose rules cannot sustain cells is eliminated while the level's computers keep running. Playing on: the grid is still populated after 50 generations, and `recordHiScore` after 12 generations stores a score of 12.
- `tests/gui/GameParticipants.test.ts` *(new)* — `createLevelParticipants` maps Level 1's roster to `[0xff0000, 0x0080ff, 0x00cc44, 0xffcc00]` in order, passes `Player` objects through by reference, falls back to white for an uncovered id, and returns an empty list for an empty roster.
- No tests for `GameController` or `GamePlayingScreen`: both are DOM and Three.js wiring, and the project's Vitest environment is `node` with no jsdom installed. Adding a DOM harness is out of scope for this issue.

- [x] Unit tests added/updated
- [x] Integration tests added/updated — `tests/integration/LevelOneGame.test.ts`, the first in this project
- [x] All tests passing (`npm run test`)

**Test coverage**: New coverage for `CheckerStartingPattern`, `Level`, `LEVEL_ONE`, `Simulation.applyStartingPattern`, `Simulation.getPlayers`, `createLevelParticipants`, and the level-to-hi-score path end to end. Existing `Simulation`, `SumRule`, `GeometryRule`, `WrapCoordinate`, and `HiScore` coverage is unaffected — no existing behaviour is modified. The suite grows from 10 files / 99 tests to 15 files / 153 tests.

**Validation evidence**:

| Command | Result |
|---------|--------|
| `npm run lint` | Passing — no errors or warnings |
| `npm run typecheck` | Passing — no diagnostics |
| `npm run test` | Passing — 15 test files, 153 tests |
| `npm run build` | Passing — `dist/assets/index--x5SPIqx.js`, 482.30 kB (gzip 121.69 kB) |

### Manual validation steps

Checks 1–6 are now automated; the table records which test replaced each one and what, if anything, still needs eyes on a browser. Only the rendering and input halves remain manual.

| # | Check | Status | How it is verified |
|---|-------|--------|--------------------|
| 1 | Level 1 opens on the checker pattern | **Automated** | `LevelOneGame.test.ts` → "fills the first block with the human player's cells". Still manual: that the blocks are visibly drawn on the canvas |
| 2 | The pattern repeats along both axes | **Automated** | `LevelOneGame.test.ts` → "repeats the checker along both axes" |
| 3 | Every fifth block is empty | **Automated** | `LevelOneGame.test.ts` → "leaves every fifth block empty", including the 2,000-empty-cell total |
| 4 | The human's selection takes effect | **Automated** | `LevelOneGame.test.ts` → "changes the outcome of the run" and "eliminates a human player whose rules cannot sustain cells" |
| 5 | The run is deterministic for a fixed selection | **Automated** | `LevelOneGame.test.ts` → the `determinism` block, comparing grid, cell counts, and generation after 25 generations |
| 6 | All four participants score, in their own colours | **Automated** | `LevelOneGame.test.ts` → "gives all four participants an equal share"; `GameParticipants.test.ts` → the colour and ordering cases. Still manual: that the scoreboard renders those rows |
| 7 | Speed, exit, and hi-score still work | **Partly automated** | The hi-score half is covered by `LevelOneGame.test.ts` → "records the generations survived as the hi-score". Speed and exit are DOM-driven: `npm run dev`, change speed, exit mid-game, confirm the title screen returns with no entry recorded |
| 8 | The canvas renders the opening grid | Manual | `npm run dev`, start a game, and confirm generation 0 shows 10×10-cell blocks of red / blue / green / yellow / black |

## Documentation Plan

| File | Changes |
|------|---------|
| `README.md` | Adds a "Levels" section defining a level, a "Level 1" subsection with the block layout and the participant table, and a "Determinism" paragraph scoping the guarantee to a fixed human selection |
| JSDoc in `src/simulation/level/Level.ts` | Documents the class, `create` with its validation failures, `createPlayers`, and `createSimulation` including that the returned simulation is already at generation 0 with the pattern applied |
| JSDoc in `src/simulation/level/LevelRoster.ts` | Documents why the human is a rules-less slot while computers are full `Player` objects |
| JSDoc in `src/simulation/level/CheckerStartingPattern.ts` | Documents the `(blockX + blockY) % length` phase formula and why the two indices are summed |
| JSDoc in `src/simulation/level/StartingPattern.ts` | Documents that `cellAt` returns a player id or `null`, and is required to be pure |
| JSDoc in `src/simulation/Simulation.ts` | Documents `applyStartingPattern`, contrasting its unconditional assignment with `seedRandom`'s skip-occupied behaviour, and `getPlayers` |

## Related Issues
Closes #15

## Checklist
- [x] Code follows project conventions (static factory methods, private constructors, one type per file)
- [x] TypeScript types are correct (`npm run typecheck` passes)
- [x] Code lints without errors (`npm run lint` passes)
- [x] All tests pass (`npm run test` passes)
- [x] Build succeeds (`npm run build` passes)
- [x] JSDoc comments added for public APIs
- [x] Updated documentation (if applicable)
- [x] No breaking changes (or documented in PR description) — the `GamePlayingScreen.show` signature change is documented below
- [ ] Commit messages follow Conventional Commits format — nothing committed yet

## Additional Notes

**Checker layout.** With `blockSize = 10` and `sequence = [1, 2, 3, 4, null]`, a 100×100 grid is 10×10 blocks and the phase is `(blockX + blockY) % 5`. The top-left corner of the grid looks like this, one character per 10×10 block (`.` is empty):

```
1 2 3 4 . 1 2 3 4 .
2 3 4 . 1 2 3 4 . 1
3 4 . 1 2 3 4 . 1 2
4 . 1 2 3 4 . 1 2 3
. 1 2 3 4 . 1 2 3 4
```

The cycle length of 5 divides the 10 blocks per row exactly, which matters because the grid is toroidal in both axes — a cycle length that did not divide 10 would put a visible seam at the wrap boundary where a block met a same-coloured neighbour. Each participant starts with 20 blocks, or 2,000 cells, and 2,000 cells start empty.

**What a level deliberately does not define.** The human player's three rules stay under the player's control on `GameConfigurationScreen`; the level fixes only the human's identity — id 1, name `Player 1` — because the starting pattern has to know which blocks the human owns. `HumanPlayerSlot` exists to make that asymmetry a type rather than a convention. A consequence worth reviewing: a level's difficulty is only partly authored, since the human can pick three rules that trivially beat or trivially lose to the level's computer rule sets. If levels later need balancing, the options are constraining which presets a level offers or adding a rules-fixed "challenge" variant — neither is in scope here.

**Scope of the determinism guarantee.** `Simulation.run` is already a pure function of the grid and the players' rules, so fixing the starting grid and the computer rule sets leaves the human's selection as the only variable input. Given the same selection, a run is reproducible generation for generation. This PR removes the grid-seeding randomness — the four `seedRandom` calls in `GamePlayingScreen.show` — and takes the computer players off `selectRandomRules`. Neither function is deleted: `seedRandom` keeps its tests, and `createGameParticipants` keeps the preset path. `Math.random()` therefore still runs in `RandomRulePresetSelection` when the configuration screen preselects three presets, which is upstream of the player's confirmation and outside the guarantee. Stated exactly: from pressing "Start game" to the grid dying, no randomness is consulted.

**Why `Level` lives in `src/simulation/`.** A level is simulation state — dimensions, players, rules, initial grid — and contains no rendering concern. Participant colour is therefore *not* part of `Level`; it stays in `src/gui/GameParticipants.ts`, which maps player id to colour. This keeps the existing one-way dependency from `src/gui` to `src/simulation` intact, which is also why `LevelOne.ts` constructs `SumRule` instances directly instead of importing the preset catalogue from `src/gui/AvailableRulePresets.ts`. The cost is that the rule definitions now exist in two places; if a future PR needs them shared, the catalogue should move down into the simulation layer rather than the level reaching up.

**Breaking change.** `GamePlayingScreen.show` changes from `show(selectedPresets: RulePreset[])` to `show(level: Level, selectedPresets: RulePreset[])`. `GameController` is its only caller and is updated in the same phase, so nothing outside `src/` is affected.
