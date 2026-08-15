# feat(levels): add Level 2, Level 3, and level selection to the configuration screen

## Summary

Adds two new levels — Level 2, whose four participants open in equal-size rectangles spread symmetrically across the grid with an equal gap between every pair, and Level 3, whose four participants open in equal-size rectangles clustered together at the grid's centre with no gap between them. Adds a level selector to the configuration screen so the player can choose between Level 1, Level 2, Level 3, or a Custom level, where a custom level lets the player pick any existing starting pattern together with any existing claim strategy while keeping Level 1's grid size and roster.

**Status: implemented.** Phases 1–5 below are built, `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` all pass, and the configuration screen's new selectors were driven end to end in a real browser (see Testing). Issue #19 still needs to be created on GitHub before this is opened as an actual PR — see Related Issues.

## Motivation

`LEVEL_ONE` (#15) proved that a level is a self-contained definition of how a game begins — dimensions, starting pattern, roster, and claim strategy (#16) — and that a game built from a level is deterministic given the human's rule choice. But today exactly one such definition exists, and `GameController.handleStartGame` hard-codes it: `this.gamePlayingScreen.show(LEVEL_ONE, selectedPresets)`. There is no way to play a second opening layout, and no way for the player to pick one even if a second existed.

Two problems follow. First, `LEVEL_ONE`'s checker pattern is the only shape of game the project can offer, even though the `StartingPattern` interface it introduced was deliberately designed to support any coordinate-addressed layout. Second, the six claim strategies added in #16 are fully implemented and tested but are reachable only by hand-authoring a new `Level` in code — nothing in the running game ever selects anything but `FirstMatchClaimStrategy`, `LEVEL_ONE`'s default.

This PR closes both gaps with the smallest change that does so generally: a reusable rectangle-placement starting pattern (used by both new levels, so adding a third rectangle-based level later is data, not a new class), and a configuration-screen selector that offers the fixed levels plus a "Custom" combination of any starting pattern with any claim strategy. The human's rule choice remains exactly as before — this PR does not touch how the human's rules are selected, only what grid and claim policy they're selected against.

## Changes

### Files Deleted

- None

### Files Updated

- **`src/simulation/level/RectangleRegion.ts`** *(new file)* — `RectangleRegion` interface: `readonly x`, `readonly y`, `readonly width`, `readonly height`, `readonly owner: Cell`. One axis-aligned block on the grid, owned by one player (or `null`).
- **`src/simulation/level/RectanglesStartingPattern.ts`** *(new file)* — `RectanglesStartingPattern implements StartingPattern`, private constructor, `static create(regions: ReadonlyArray<RectangleRegion>)`. `cellAt(x, y)` returns the `owner` of the first region containing `(x, y)`, else `null`. One reusable class instead of a bespoke pattern per level — Level 2 and Level 3 differ only in the region coordinates they pass in.
- **`src/simulation/level/LevelOne.ts`** — Hoists the inline `CheckerStartingPattern.create(CHECKER_BLOCK_SIZE, CHECKER_SEQUENCE)` argument into a named `export const LEVEL_ONE_STARTING_PATTERN`, reused by `LEVEL_ONE`'s definition. Needed so the custom-pattern catalogue (Phase 4) can reuse Level 1's exact pattern instance instead of re-deriving its parameters in a second file. `LEVEL_ONE`'s own grid is unaffected.
- **`src/simulation/level/LevelTwo.ts`** *(new file)* — `export const LEVEL_TWO_STARTING_PATTERN` and `export const LEVEL_TWO = Level.create(2, 'Level 2', 100, 100, ROSTER, LEVEL_TWO_STARTING_PATTERN)`. Roster identical in shape and rules to Level 1's. Four 20×20 `RectangleRegion`s, one per player, each centred in its own grid quadrant — see Implementation Plan for exact coordinates and the equal-gap reasoning.
- **`src/simulation/level/LevelThree.ts`** *(new file)* — `export const LEVEL_THREE_STARTING_PATTERN` and `export const LEVEL_THREE = Level.create(3, 'Level 3', 100, 100, ROSTER, LEVEL_THREE_STARTING_PATTERN)`. Same roster again. Four 20×20 `RectangleRegion`s tiled together at the grid's centre with no gap between them.
- **`src/simulation/level/CustomLevel.ts`** *(new file)* — `export function createCustomLevel(startingPattern: StartingPattern, claimStrategy: ClaimStrategy): Level`, returning a `Level` built from `LEVEL_ONE`'s width, height, and roster with the supplied pattern and strategy substituted in.
- **`src/simulation/level/index.ts`** — Exports `RectangleRegion` (type), `RectanglesStartingPattern`, `LEVEL_ONE_STARTING_PATTERN`, `LEVEL_TWO`, `LEVEL_TWO_STARTING_PATTERN`, `LEVEL_THREE`, `LEVEL_THREE_STARTING_PATTERN`, and `createCustomLevel`.
- **`src/simulation/index.ts`** — Re-exports the same new names from `./level`.
- **`src/gui/AvailableLevels.ts`** *(new file)* — `export const AVAILABLE_LEVELS: ReadonlyArray<Level> = [LEVEL_ONE, LEVEL_TWO, LEVEL_THREE]`. Mirrors the existing `AVAILABLE_RULE_PRESETS` catalogue pattern.
- **`src/gui/AvailableStartingPatterns.ts`** *(new file)* — `StartingPatternOption` interface (`name`, `description`, `pattern`) and `AVAILABLE_STARTING_PATTERNS`, listing the checker and the two rectangle patterns by reusing `LEVEL_ONE_STARTING_PATTERN`, `LEVEL_TWO_STARTING_PATTERN`, and `LEVEL_THREE_STARTING_PATTERN` — no pattern parameters are duplicated.
- **`src/gui/AvailableClaimStrategies.ts`** *(new file)* — `ClaimStrategyOption` interface (`name`, `description`, `strategy`) and `AVAILABLE_CLAIM_STRATEGIES`, one entry per existing strategy class from `src/simulation/claim/`, each composing strategy given `FirstMatchClaimStrategy.create()` as its fallback.
- **`src/gui/screens/GameConfigurationScreen.ts`** — `onStartGame` becomes `(level: Level, selected: RulePreset[]) => void`. Adds a level `<select>` (the three fixed levels plus `"Custom"`); choosing `"Custom"` reveals a starting-pattern `<select>` and a claim-strategy `<select>` sourced from the two new catalogues. `startButton`'s handler resolves the chosen `Level` — either the selected fixed level, or `createCustomLevel(pattern, strategy)` — and passes it as the new first argument to `onStartGame`.
- **`src/gui/GameController.ts`** — `handleStartGame` gains a `level: Level` parameter and forwards it to `gamePlayingScreen.show(level, selectedPresets)` in place of the hard-coded `LEVEL_ONE`. The `LEVEL_ONE` import is removed; a `Level` type import is added.
- **`tests/simulation/level/RectanglesStartingPattern.test.ts`** *(new file)*
- **`tests/simulation/level/LevelTwo.test.ts`** *(new file)*
- **`tests/simulation/level/LevelThree.test.ts`** *(new file)*
- **`tests/simulation/level/CustomLevel.test.ts`** *(new file)*
- **`tests/gui/AvailableLevels.test.ts`** *(new file)*
- **`tests/gui/AvailableStartingPatterns.test.ts`** *(new file)*
- **`tests/gui/AvailableClaimStrategies.test.ts`** *(new file)*
- **`README.md`** — Adds "Level 2" and "Level 3" subsections under "Levels", a "Choosing a level" subsection describing the selector and the Custom option, and a cross-reference from "Cell claim" noting that a level's — including a custom level's — claim strategy is what that picker selects.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [x] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [x] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [x] Test coverage improvement

`GameConfigurationScreen`'s `onStartGame` callback and `GameController.handleStartGame` both gain a leading `Level` parameter. `GameController` is the only caller of both, and is updated in the same phase (Phase 3), so nothing outside `src/` is affected — the same shape of internal-only break `GamePlayingScreen.show` took in #15.

## Implementation Plan

### Phase 1 — Generalize starting patterns into a reusable rectangle-region primitive

**Pre-condition**: `src/simulation/level/` has one `StartingPattern` implementation, `CheckerStartingPattern`. There is no way to place a named rectangular block bound to a fixed player. No dependencies on other phases.

**Steps**:
1. Create `src/simulation/level/RectangleRegion.ts` declaring `export interface RectangleRegion { readonly x: number; readonly y: number; readonly width: number; readonly height: number; readonly owner: Cell }`, importing `Cell` from `../Cell`. `x`/`y` is the region's top-left corner in grid coordinates; `width`/`height` extend right and down from there.
2. Create `src/simulation/level/RectanglesStartingPattern.ts` with a private constructor storing `regions: ReadonlyArray<RectangleRegion>`, and `public static create(regions: ReadonlyArray<RectangleRegion>): RectanglesStartingPattern`, throwing `RangeError('regions must not be empty')` for an empty array.
3. In the same file, implement `cellAt(x, y): Cell` by iterating `this.regions` in order and returning the `owner` of the first region where `x >= region.x && x < region.x + region.width && y >= region.y && y < region.y + region.height`; return `null` once every region has been checked. Iterating in declaration order rather than validating non-overlap keeps the class a pure lookup; non-overlap is a caller responsibility documented on the class, exactly as `StartingPattern.cellAt` already documents purity as a caller responsibility.
4. Create `tests/simulation/level/RectanglesStartingPattern.test.ts` asserting: a cell inside a region returns that region's owner; a cell outside every region returns `null`; a cell on a region's near edge (`x`, `y`) is included and on its far edge (`x + width`, `y + height`) is excluded; two regions placed edge-to-edge produce no gap cell and no double-claimed cell; `create` throws for an empty array.

**Post-condition**: `RectanglesStartingPattern` is a standalone, tested value object implementing `StartingPattern`. Nothing constructs it outside its own test yet.

### Phase 2 — Define Level 2 (equal-gap spread) and Level 3 (centre cluster)

**Pre-condition**: Phase 1 is complete — `RectanglesStartingPattern` and `RectangleRegion` compile from `src/simulation/level/`. Only `LEVEL_ONE` exists as a playable level.

**Steps**:
1. Create `src/simulation/level/LevelTwo.ts` with module constants `GRID_WIDTH = 100`, `GRID_HEIGHT = 100`, `RECTANGLE_SIZE = 20`, and a `ROSTER: LevelRoster` identical in shape to `LevelOne.ts`'s — the same human slot (`id: 1, name: 'Player 1'`) and the same three computer players and rule sets. Level 2 changes the opening grid only, not who plays or with which rules, so nothing about difficulty is being tuned here.
2. In the same file, define `export const LEVEL_TWO_STARTING_PATTERN = RectanglesStartingPattern.create([...])` with four `RectangleRegion` entries, one per participant, each `20×20`, centred in its own grid quadrant: `{ x: 15, y: 15, width: 20, height: 20, owner: 1 }` (top-left, human), `{ x: 65, y: 15, width: 20, height: 20, owner: 2 }` (top-right), `{ x: 15, y: 65, width: 20, height: 20, owner: 3 }` (bottom-left), `{ x: 65, y: 65, width: 20, height: 20, owner: 4 }` (bottom-right). On a 100×100 toroidal grid this leaves exactly a 30-cell gap between every horizontally- or vertically-adjacent pair, including across the wrap boundary (`85` to `115 mod 100 = 15` is also a 30-cell gap) — the "equal distance between all rectangles" requirement, satisfied because the grid wraps.
3. In the same file, define `export const LEVEL_TWO = Level.create(2, 'Level 2', GRID_WIDTH, GRID_HEIGHT, ROSTER, LEVEL_TWO_STARTING_PATTERN)`.
4. Create `src/simulation/level/LevelThree.ts` the same way, with its own `RECTANGLE_SIZE = 20` and `export const LEVEL_THREE_STARTING_PATTERN = RectanglesStartingPattern.create([...])`, placing the same four regions clustered at the grid's centre instead of its quadrants: `{ x: 30, y: 30, width: 20, height: 20, owner: 1 }`, `{ x: 50, y: 30, width: 20, height: 20, owner: 2 }`, `{ x: 30, y: 50, width: 20, height: 20, owner: 3 }`, `{ x: 50, y: 50, width: 20, height: 20, owner: 4 }`. The four rectangles tile one contiguous 40×40 block with no gap between them, so every player starts adjacent to every other player rather than isolated.
5. In the same file, define `export const LEVEL_THREE = Level.create(3, 'Level 3', GRID_WIDTH, GRID_HEIGHT, ROSTER, LEVEL_THREE_STARTING_PATTERN)`.
6. Update `src/simulation/level/index.ts` to export `RectangleRegion` (type), `RectanglesStartingPattern`, `LEVEL_TWO`, `LEVEL_TWO_STARTING_PATTERN`, `LEVEL_THREE`, and `LEVEL_THREE_STARTING_PATTERN`. Update `src/simulation/index.ts`'s re-export list from `./level` to match.
7. Create `tests/simulation/level/LevelTwo.test.ts` and `tests/simulation/level/LevelThree.test.ts`, mirroring `LevelOne.test.ts`: fixed 100×100 dimensions, the four-participant roster, and the exact boundary cells of each layout — Level 2: `cellAt(15,15) === 1`, `cellAt(34,34) === 1`, `cellAt(35,35) === null`, `cellAt(64,15) === null`, `cellAt(65,15) === 2`; Level 3: `cellAt(49,49) === 1`, `cellAt(50,49) === 2`, `cellAt(49,50) === 3`, `cellAt(50,50) === 4`, and no cell inside `[30,70) × [30,70)` returning `null`.

**Post-condition**: `LEVEL_TWO` and `LEVEL_THREE` exist, are independently tested, and produce the described equal-gap and clustered grids when run through `Simulation.applyStartingPattern` — the same guarantee `LevelOneGame.test.ts` already established for Level 1. Neither is reachable from the running game yet.

### Phase 3 — Let the player choose a fixed level on the configuration screen

**Pre-condition**: Phases 1–2 are complete. `GameController.handleStartGame` always plays `LEVEL_ONE`; `GameConfigurationScreen` has no notion of a level.

**Steps**:
1. Create `src/gui/AvailableLevels.ts` exporting `export const AVAILABLE_LEVELS: ReadonlyArray<Level> = [LEVEL_ONE, LEVEL_TWO, LEVEL_THREE];`, importing the three constants from `../simulation`. Mirrors the existing `AVAILABLE_RULE_PRESETS` catalogue pattern for a GUI-facing list built from simulation-layer building blocks.
2. In `src/gui/screens/GameConfigurationScreen.ts`, change the `onStartGame` field and constructor parameter type from `(selected: RulePreset[]) => void` to `(level: Level, selected: RulePreset[]) => void`, importing `Level` as a type from `../../simulation`.
3. In the same file, add a `private selectedLevel: Level` field defaulted to `AVAILABLE_LEVELS[0]`, and in `show()`, before the existing rule list, build a "Choose a level" `<select>` with one `<option>` per `AVAILABLE_LEVELS` entry (value = index, label = `level.name`) plus a trailing `<option value="custom">Custom</option>`. A `change` listener updates `this.selectedLevel` for a numbered option; the `"custom"` option is wired up in Phase 4.
4. In the same file's `startButton` click handler, replace `this.onStartGame(selected)` with `this.onStartGame(this.selectedLevel, selected)`.
5. In `src/gui/GameController.ts`, change `handleStartGame(selectedPresets: RulePreset[])` to `handleStartGame(level: Level, selectedPresets: RulePreset[])`, forward `level` into `this.gamePlayingScreen.show(level, selectedPresets)` in place of the hard-coded `LEVEL_ONE`, remove the now-unused `LEVEL_ONE` import, and add a `Level` type import from `../simulation`. Update the constructor's `configScreen` callback from `(selected) => { this.handleStartGame(selected); }` to `(level, selected) => { this.handleStartGame(level, selected); }`.
6. Create `tests/gui/AvailableLevels.test.ts` asserting the catalogue holds exactly the three levels in id order 1, 2, 3.
7. Neither `GameConfigurationScreen` nor `GameController` has an existing test file — per #15's note, both are DOM/Three.js wiring and the project's Vitest environment has no jsdom installed. No test changes are made for steps 2–5; this is recorded explicitly in Testing rather than silently skipped.

**Post-condition**: The configuration screen lets the player pick Level 1, 2, or 3 before starting; the choice reaches `GamePlayingScreen.show` exactly as `LEVEL_ONE` did before this phase.

### Phase 4 — Add the custom level selector (starting pattern + claim strategy)

**Pre-condition**: Phase 3 is complete. The level `<select>`'s `"custom"` option is wired to nothing. The three starting patterns and six claim strategies exist as simulation-layer classes with no GUI-facing catalogue and no way to combine them into a playable `Level`.

**Steps**:
1. In `src/simulation/level/LevelOne.ts`, hoist the inline `CheckerStartingPattern.create(CHECKER_BLOCK_SIZE, CHECKER_SEQUENCE)` call out of the `Level.create(...)` argument list into `export const LEVEL_ONE_STARTING_PATTERN = CheckerStartingPattern.create(CHECKER_BLOCK_SIZE, CHECKER_SEQUENCE);`, and pass `LEVEL_ONE_STARTING_PATTERN` into `LEVEL_ONE`'s definition in its place. Before: the pattern instance existed only inside `LEVEL_ONE` and had no name of its own. After: the same instance is separately reachable, which is what lets this phase's pattern catalogue reuse it instead of re-deriving the checker parameters a second time. `LEVEL_ONE`'s resulting grid is unchanged, since it is built from the same instance either way.
2. Export `LEVEL_ONE_STARTING_PATTERN` from `src/simulation/level/index.ts` and `src/simulation/index.ts` alongside the existing `LEVEL_ONE` export.
3. Create `src/simulation/level/CustomLevel.ts` exporting `export function createCustomLevel(startingPattern: StartingPattern, claimStrategy: ClaimStrategy): Level`, returning `Level.create(CUSTOM_LEVEL_ID, 'Custom Level', LEVEL_ONE.width, LEVEL_ONE.height, LEVEL_ONE.roster, startingPattern, claimStrategy)`, with `CUSTOM_LEVEL_ID` a module constant `0` (distinct from the 1–3 used by the fixed levels). Reusing `LEVEL_ONE.width`, `.height`, and `.roster` keeps a custom level's participants and grid size identical to the fixed levels, so only the two selected building blocks vary — matching the literal request without also exposing grid size as a variable.
4. Export `createCustomLevel` from `src/simulation/level/index.ts` and `src/simulation/index.ts`.
5. Create `src/gui/AvailableStartingPatterns.ts` exporting `export interface StartingPatternOption { readonly name: string; readonly description: string; readonly pattern: StartingPattern }` and `export const AVAILABLE_STARTING_PATTERNS: ReadonlyArray<StartingPatternOption>` with three entries reusing `LEVEL_ONE_STARTING_PATTERN`, `LEVEL_TWO_STARTING_PATTERN`, and `LEVEL_THREE_STARTING_PATTERN` (imported from `../simulation`), each with a short `description` describing the layout.
6. Create `src/gui/AvailableClaimStrategies.ts` exporting `export interface ClaimStrategyOption { readonly name: string; readonly description: string; readonly strategy: ClaimStrategy }` and `export const AVAILABLE_CLAIM_STRATEGIES: ReadonlyArray<ClaimStrategyOption>` with six entries — `FirstMatchClaimStrategy.create()`, and each of `IncumbentClaimStrategy`, `StrongestMatchClaimStrategy`, `NeighbourMajorityClaimStrategy`, and `ContestedCellVoidStrategy` composed with `FirstMatchClaimStrategy.create()` as fallback, plus `RotatingPriorityClaimStrategy.create()` — with descriptions drawn from the "six strategies at a glance" table in #16.
7. In `src/gui/screens/GameConfigurationScreen.ts`, when the level `<select>`'s `"custom"` option is chosen, reveal two additional `<select>` elements built from `AVAILABLE_STARTING_PATTERNS` and `AVAILABLE_CLAIM_STRATEGIES` (label = `.name`, each defaulting to index 0); choosing any other option hides both. Track the two choices in `private selectedStartingPatternIndex: number` and `private selectedClaimStrategyIndex: number`, both defaulted to `0`.
8. In the same file's `startButton` click handler, resolve the level passed to `onStartGame` as `this.selectedLevel` when the level `<select>` is not on `"custom"`, otherwise `createCustomLevel(AVAILABLE_STARTING_PATTERNS[this.selectedStartingPatternIndex].pattern, AVAILABLE_CLAIM_STRATEGIES[this.selectedClaimStrategyIndex].strategy)`, imported from `../../simulation`.
9. Create `tests/simulation/level/CustomLevel.test.ts` asserting `createCustomLevel` returns a `Level` with `LEVEL_ONE`'s width, height, and roster; the supplied pattern is reflected in `createSimulation(...).getGrid()` at generation 0; and the supplied strategy — not `FirstMatchClaimStrategy` — decides a contested cell. Create `tests/gui/AvailableStartingPatterns.test.ts` and `tests/gui/AvailableClaimStrategies.test.ts` asserting each catalogue's length (3 and 6) and that every entry's `.pattern` / `.strategy` behaves as the corresponding named class instance would.

**Post-condition**: Choosing "Custom" on the configuration screen reveals a starting-pattern picker and a claim-strategy picker. Starting a game with "Custom" selected plays a level with Level 1's participants and grid size but the chosen pattern and strategy.

### Phase 5 — Document the new levels and the selectors

**Pre-condition**: Phase 4 is complete and the suite is green. `README.md`'s "Levels" section describes only Level 1 and says nothing about choosing a level or building a custom one.

**Steps**:
1. In `README.md`'s "Levels" section, add "Level 2" and "Level 3" subsections in the style of the existing "Level 1" subsection: a short block-layout description, and the equal-gap-versus-clustered contrast between the two.
2. Add a "Choosing a level" subsection describing the configuration-screen selector — the three fixed levels by name, and the "Custom" option's two extra pickers.
3. Add a cross-reference from the existing "Cell claim" section (#16) noting that a level's claim strategy, including a custom level's chosen strategy, is exactly what the picker added in step 2 selects, so the two sections describe one consistent mechanism.

**Post-condition**: `README.md` documents Level 2, Level 3, the level selector, and the custom level selector, consistent with the existing "Levels" and "Cell claim" sections.

## Testing

### TypeScript unit tests

- `tests/simulation/level/RectanglesStartingPattern.test.ts` *(new, 7 tests)* — region membership, edge inclusion/exclusion, edge-to-edge adjacency with no gap or overlap, several distinct regions resolving independently, immutability against later mutation of the supplied array, `create` rejecting an empty region list.
- `tests/simulation/level/LevelTwo.test.ts` *(new, 7 tests)* / `LevelThree.test.ts` *(new, 7 tests)* — fixed dimensions and roster, the exact boundary cells of each layout, and the 400-cells-per-participant count.
- `tests/simulation/level/CustomLevel.test.ts` *(new, 3 tests)* — dimensions/roster passthrough from `LEVEL_ONE`, the supplied pattern reflected in the built simulation's grid, the supplied strategy reflected on the returned `Level`.
- `tests/gui/AvailableLevels.test.ts` *(new, 2 tests)*, `AvailableStartingPatterns.test.ts` *(new, 3 tests)*, `AvailableClaimStrategies.test.ts` *(new, 3 tests)* — catalogue lengths, display names, and that catalogue entries are the expected underlying instances.
- No new tests for `GameConfigurationScreen` or `GameController`: both remain DOM/Three.js wiring with no jsdom harness, matching the precedent set in #15. Covered instead by the manual/Playwright pass below.

- [x] Unit tests added/updated
- [x] Integration tests added/updated — `CustomLevel.test.ts` exercises a level end to end through `createSimulation(...).getGrid()`
- [x] All tests passing (`npm run test`)

**Test coverage**: New coverage for `RectanglesStartingPattern`, `LEVEL_TWO`, `LEVEL_THREE`, `createCustomLevel`, and the three new GUI catalogues. No existing test changed behaviour — `LEVEL_ONE`'s grid is unaffected by hoisting its pattern into a named constant. The suite grows from 23 files / 234 tests (#16) to 30 files / 267 tests.

**Validation evidence**:

| Command | Result |
|---------|--------|
| `npm run lint` | Passing — no errors or warnings |
| `npm run typecheck` | Passing — no diagnostics |
| `npm run test` | Passing — 30 test files, 267 tests |
| `npm run build` | Passing — `dist/assets/index-CIbnMrPS.js`, 489.93 kB (gzip 123.80 kB) |

### Manual validation steps

| # | Check | Status | How it was verified |
|---|-------|--------|----------------------|
| 1 | Level 2 opens on four equally-spaced rectangles | **Automated** | `LevelTwo.test.ts` asserts the boundary cells and the equal gap; visually confirmed via the Playwright pass below with Level 2 selected |
| 2 | Level 3 opens on four clustered rectangles | **Automated** | `LevelThree.test.ts` asserts no gap inside the 40×40 block; visually confirmed screenshot shows four adjacent colour blocks with no black seam between them (captured with "Custom" + "Centre cluster" selected) |
| 3 | The level selector defaults to Level 1 | **Verified (Playwright)** | Screenshot `01-config-default.png`: the level `<select>` opens on "Level 1" with no further input |
| 4 | Choosing "Custom" reveals the two extra pickers | **Verified (Playwright)** | Screenshot `03-custom-revealed.png`: selecting "Custom" reveals "Starting pattern" (Checker / Spread rectangles / Centre cluster) and "Claim strategy" (all six strategies) pickers |
| 5 | A custom combination plays as selected | **Verified (Playwright)** | Chose "Custom" + "Centre cluster" + "Contested cells stay empty", clicked "Start game": screenshot `04-game-started-custom.png` shows a running game with all four scoreboard entries at 400 cells each, matching Level 3's layout, and zero browser console errors |

Driven with a headless Chromium via Playwright against `npm run dev` (no project skill for launching this app existed yet; a `chromium-cli`-less environment meant scripting `playwright` directly). Screenshots and the driver script are session-scratch artifacts, not committed to the repo.

## Documentation Plan

| File | Changes |
|------|---------|
| `README.md` | Adds "Level 2" and "Level 3" subsections under "Levels", a "Choosing a level" subsection covering the selector and the Custom option, and a cross-reference from "Cell claim" tying a level's strategy to the new picker |
| JSDoc in `src/simulation/level/RectanglesStartingPattern.ts` | Documents the region-membership rule and that overlap/order is a caller responsibility |
| JSDoc in `src/simulation/level/RectangleRegion.ts` | Documents the coordinate convention (`x`/`y` as top-left corner, extending right/down) |
| JSDoc in `src/simulation/level/CustomLevel.ts` | Documents that a custom level reuses Level 1's dimensions and roster, varying only the pattern and strategy |
| JSDoc in `src/simulation/level/LevelTwo.ts` / `LevelThree.ts` | Documents the equal-gap and clustered layouts respectively, matching `LevelOne.ts`'s existing style |

## Related Issues
Closes #19
Related to #15
Related to #16

## Checklist
- [x] Code follows project conventions (static factory methods, private constructors, one type per file)
- [x] TypeScript types are correct (`npm run typecheck` passes)
- [x] Code lints without errors (`npm run lint` passes)
- [x] All tests pass (`npm run test` passes)
- [x] Build succeeds (`npm run build` passes)
- [x] JSDoc comments added for public APIs
- [x] Updated documentation (if applicable) — `README.md` "Level 2", "Level 3", and "Choosing a level" sections
- [x] No breaking changes — the internal-only `onStartGame` / `handleStartGame` signature change is documented under Type of Change
- [ ] Commit messages follow Conventional Commits format — nothing committed yet

## Additional Notes

**Why one `RectanglesStartingPattern` instead of two bespoke classes.** Level 2 and Level 3 differ only in where their four rectangles sit, not in how a rectangle claims a cell. A single class taking a list of `RectangleRegion`s expresses that: adding a fourth rectangle-based level later is a new data file, not a new class, the same reuse `CheckerStartingPattern` already gets from `LEVEL_ONE`'s block size and sequence being parameters rather than baked in.

**Why Level 2 and Level 3 reuse Level 1's exact roster.** Neither part of the request asked for different computer rule sets, and introducing them would make it impossible to attribute a difference in play to the starting pattern alone versus a difference in opponent strength. Keeping the roster fixed isolates the variable this PR is actually about.

**Why a custom level doesn't expose grid size.** This was raised explicitly during scoping and declined in favour of matching the literal request — "select the starting pattern and claim strategy" — without adding a third, unrequested control. If custom grid sizing is wanted later, `createCustomLevel` can grow an optional `width`/`height` pair without changing its existing callers.

**The equal-distance guarantee depends on the grid being toroidal.** Level 2's 30-cell gap is equal in every direction only because the grid wraps (#3); the same rectangle coordinates on a bounded grid would leave a larger gap at the outer edges than between the two inner-facing pairs. This is called out here because it is easy to get right by construction and easy to get wrong by intuition.

**`CUSTOM_LEVEL_ID = 0`.** The three fixed levels use ids 1–3, matching their `LEVEL_ONE`/`TWO`/`THREE` declaration order. `0` is deliberately outside that sequence so a custom level's id can never collide with a fixed one, without needing a registry to check uniqueness at runtime.

**Issue #19 does not exist yet on GitHub** (checked via `gh issue list`, which currently ends at #18). Create it before opening this as an actual pull request, or update the "Closes #19" line above if a different number is assigned.
