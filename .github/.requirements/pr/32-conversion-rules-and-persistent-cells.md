## Title

`feat(simulation): add conversion rules and a conversion simulation mode for takeover waves and catalysts`

## Summary
Adds a `ConversionRule` that lets a player take a cell based on what the cell currently holds and which player's cells surround it, and a `PersistentValueRuleSetApplicationStrategy` that keeps a cell's value when no rule matches it. Together they are published as a **Conversion simulation** game mode, three conversion rule presets, and a scripted **Level 4** in which a converter sweeps through a field of gas and a stationary catalyst turns the converter's cells into a fifth colour.

## Motivation
Every rule in the game today counts only the acting player's own neighbours: `SumRule` and `GeometryRule` both compare `grid[ny][nx].value === playerId` and never read what the resolved cell currently holds or which *other* player is nearby. A rule therefore cannot say "a cell held by player B becomes mine when player A's cells are next to it", which is the interaction that produces conversion waves (one colour sweeping through another) and catalysts (one colour causing a second colour to appear around it).

A second gap is in the rule-application stage. Under both existing `RuleSetApplicationStrategy` implementations a cell that no player's rules match becomes empty, because `CellClaim.resolve` returns `null` when there are no candidates. Stable regions with a moving front between them cannot exist: every cell needs a Born/Survive rule to stay alive from one generation to the next, so the grid churns like Life instead of holding territory until something converts it.

This PR covers the conversion behaviour on the existing grid only. Continuous-position particles (attraction, repulsion and clustering) are a separate, later change; nothing moves in this PR, so a catalyst is a stationary cell.

## Changes

### Files Deleted
- None

### Files Updated

**Simulation — cell selectors**

- **`src/simulation/rule/selector/CellSelector.ts`** *(new file)* — Interface `CellSelector` with one method, `selects(value: number | null, playerId: number): boolean`, answering whether a cell value belongs to the group the selector names, relative to the player the rule is evaluated for.
- **`src/simulation/rule/selector/OwnCellSelector.ts`** *(new file)* — Selects cells whose value equals `playerId`. Stateless; `OwnCellSelector.create()`.
- **`src/simulation/rule/selector/OtherPlayerCellSelector.ts`** *(new file)* — Selects cells whose value is non-null and differs from `playerId`. Stateless; `OtherPlayerCellSelector.create()`.
- **`src/simulation/rule/selector/EmptyCellSelector.ts`** *(new file)* — Selects cells whose value is `null`. Stateless; `EmptyCellSelector.create()`.
- **`src/simulation/rule/selector/SpecificPlayerCellSelector.ts`** *(new file)* — Selects cells whose value equals a fixed player id, ignoring `playerId`. `SpecificPlayerCellSelector.create(targetPlayerId)` throws `RangeError` when the id is not a positive integer.
- **`src/simulation/rule/selector/index.ts`** *(new file)* — Barrel exporting the interface and the four selectors.

**Simulation — rule, strategy, mode**

- **`src/simulation/rule/ConversionRule.ts`** *(new file)* — `ConversionRule implements Rule`. `ConversionRule.create(target: CellSelector, trigger: CellSelector, counts: number[])`. `matches(grid, x, y, playerId)` returns true when `target.selects(grid[y][x].value, playerId)` holds and the number of Moore neighbours whose value `trigger` selects is in `counts`. Throws `TypeError` when a selector is missing or `counts` is not an array, and `RangeError` when a count is not an integer in 0–8. Uses `NeighborhoodUtils.forEachMooreNeighbor`, so it wraps at the edges like the existing rules.
- **`src/simulation/rule/index.ts`** — Exports `ConversionRule` and re-exports the selector barrel.
- **`src/simulation/claim/application/PersistentValueRuleSetApplicationStrategy.ts`** *(new file)* — Decorator over another `RuleSetApplicationStrategy`. `create(inner)` throws `TypeError` when `inner` is missing. `buildCandidates` returns the inner strategy's candidates when there are any; otherwise, when the cell's current value is a roster player, it returns that player as the sole candidate with `matchedRuleCount: 0`, so the cell keeps its value. `resolveOwner` delegates to `inner`.
- **`src/simulation/claim/application/index.ts`**, **`src/simulation/claim/index.ts`** — Export `PersistentValueRuleSetApplicationStrategy`.
- **`src/simulation/claim/ClaimCandidate.ts`** — JSDoc only: `matchedRuleCount` may be `0` for an incumbent offered as a fallback candidate.
- **`src/simulation/claim/resolution/CellClaimResolutionStrategy.ts`** — JSDoc only: the candidates are "the players eligible for the cell" rather than strictly "the players whose rules matched".
- **`src/simulation/mode/ConversionSimulationMode.ts`** *(new file)* — Static-only preset factory mirroring `GlobalSimulationMode`: `create()` returns `ConfigurableSimulationMode.create(SweepAllCellsIterationStrategy.create(), PersistentValueRuleSetApplicationStrategy.create(UnrestrictedRuleSetApplicationStrategy.create()))`.
- **`src/simulation/mode/index.ts`** — Exports `ConversionSimulationMode`.

**Simulation — level**

- **`src/simulation/level/Level.ts`** — Adds `readonly mode: SimulationMode | null` and a trailing optional `mode` parameter on `Level.create` (default `null`). `createSimulation` uses `this.mode ?? mode`, and skips `applyStartPositioning` when the level fixes its mode.
- **`src/simulation/level/LevelFour.ts`** *(new file)* — `LEVEL_FOUR` and `LEVEL_FOUR_STARTING_PATTERN`: a 100x100 grid with five participants and `ConversionSimulationMode.create()` as its fixed mode (roster and layout in Phase 3).
- **`src/simulation/level/index.ts`** — Exports `LEVEL_FOUR` and `LEVEL_FOUR_STARTING_PATTERN`.
- **`src/simulation/index.ts`** — Exports `ConversionRule`, the `CellSelector` type, the four selectors, `PersistentValueRuleSetApplicationStrategy`, `ConversionSimulationMode`, `LEVEL_FOUR` and `LEVEL_FOUR_STARTING_PATTERN`.

**GUI**

- **`src/gui/AvailableRulePresets.ts`** — Appends three presets built from relative selectors: `Overrun at 3+` (another player's cell with 3–8 of my neighbours becomes mine), `Infiltrate at 1–2` (another player's cell with 1 or 2 of my neighbours becomes mine) and `Settle at 1+` (an empty cell with 1–8 of my neighbours becomes mine).
- **`src/gui/AvailableRuleSetApplications.ts`** — Appends `Cells keep their value` → `PersistentValueRuleSetApplicationStrategy.create(UnrestrictedRuleSetApplicationStrategy.create())`.
- **`src/gui/AvailableSimulationModes.ts`** — Appends `Conversion simulation` → `ConversionSimulationMode.create()`, `requiresStartPositioning: false`.
- **`src/gui/AvailableLevels.ts`** — Appends `LEVEL_FOUR`.
- **`src/gui/GameParticipants.ts`** — Adds a colour for player id 5 to `PLAYER_COLORS` through a separate `LEVEL_ONLY_PLAYER_COLORS` constant, so Level 4's fifth participant is not drawn in the white fallback and a custom game still creates three computer players.
- **`src/gui/LevelModeSelection.ts`** *(new file)* — Two pure functions: `resolveEffectiveMode(level, selectedMode): SimulationMode` returns `level.mode ?? selectedMode`; `resolveEffectiveStartPositioning(level, selectedPositioning): StartPositioningStrategy | null` returns `null` when the level fixes its mode.
- **`src/gui/screens/GameConfigurationScreen.ts`** — The "Start game" handler resolves the level once and passes the mode and positioning through `LevelModeSelection`. The level `<select>` change handler hides the mode, custom-mode and positioning controls when the selected level fixes its mode, and shows a one-line notice naming it.
- **`src/gui/index.ts`** — Exports the two `LevelModeSelection` functions.

**Tests**

- **`tests/simulation/rule/selector/CellSelectors.test.ts`** *(new file)* — Each selector against own, other, empty and specific values; `SpecificPlayerCellSelector.create` validation.
- **`tests/simulation/rule/ConversionRule.test.ts`** *(new file)* — Target mismatch never matches; trigger counts inside and outside the set; a specific-player trigger that differs from the acting player (catalyst); wrap-around at the grid edge; `create` validation.
- **`tests/simulation/claim/application/PersistentValueRuleSetApplicationStrategy.test.ts`** *(new file)* — Inner candidates pass through unchanged; an unmatched occupied cell yields the incumbent with `matchedRuleCount: 0`; an unmatched empty cell yields no candidate; a value not in the roster yields no candidate; `resolveOwner` delegates; `create` validation.
- **`tests/simulation/mode/ConversionSimulationMode.test.ts`** *(new file)* — An unmatched cell keeps its value across a generation; a matched conversion replaces it.
- **`tests/simulation/level/LevelFour.test.ts`** *(new file)* — Roster ids and names, fixed mode, starting-pattern ownership at representative coordinates.
- **`tests/simulation/level/Level.test.ts`** — `mode` defaults to `null`; a level's own mode wins over the supplied one; positioning is skipped when the level fixes its mode.
- **`tests/integration/ConversionGame.test.ts`** *(new file)* — The converter front advances through gas generation by generation; cells away from the front are unchanged; converter cells beside a catalyst become the product colour while the catalyst cell stays; the incumbent fallback survives each of the six claim strategies.
- **`tests/gui/AvailableRuleSetApplications.test.ts`**, **`tests/gui/AvailableSimulationModes.test.ts`** — Length 2 → 3, plus the new entry's name and position.
- **`tests/gui/AvailableLevels.test.ts`** — Ids `[1, 2, 3, 4]` and the fourth name.
- **`tests/gui/AvailableRulePresets.test.ts`** *(new file)* — Catalogue length, unique names, non-empty descriptions, the three conversion presets present.
- **`tests/gui/GameParticipants.test.ts`** — Player id 5 gets a palette colour distinct from the other four; the default-colour test moves to an id the palette still does not cover.
- **`tests/gui/LevelModeSelection.test.ts`** *(new file)* — A level without a mode returns the selected mode and positioning; a level with a mode returns its own mode and `null` positioning.

**Documentation**

- **`README.md`** — See the Documentation Plan.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [x] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [x] Test coverage improvement

## Design Decisions

Settled in a design interview before this plan was written.

| # | Decision | Outcome |
|---|----------|---------|
| Scope | What this PR covers | Conversion on the existing grid only; continuous-position particles are deferred |
| 1 | What a "type" is | A type is a player: a cell's value stays a player id, and a conversion is one player's cell becoming another's |
| 2 | Where a conversion lives | A new rule class on the existing `Rule` interface, owned by the player the cell becomes |
| 3 | Cells that nothing converts | A new rule-application strategy keeps the cell's value |
| 4 | How a rule names target and trigger | A selector that is relative (own, any other, empty) or specific (player N) |
| 5 | How it is surfaced | A named mode, presets and a scripted level; a level can fix its own mode |
| 6 | How a conversion game ends | It runs until the player exits; no new end condition in this PR |

## Implementation Plan

### Phase 1 — Express a conversion as a rule

**Pre-condition**: `Rule.matches(grid, x, y, playerId)` receives the whole grid, but both implementations read only the acting player's own neighbours and never the resolved cell's current value.

1. Create `src/simulation/rule/selector/CellSelector.ts` with the interface `CellSelector { selects(value: number | null, playerId: number): boolean }`. A selector is an interface with one class per kind, not one class with a kind field, so adding a kind does not edit an existing class.
2. Create `OwnCellSelector.ts`, `OtherPlayerCellSelector.ts`, `EmptyCellSelector.ts` and `SpecificPlayerCellSelector.ts` in the same folder, each with a private constructor and a static `create`. The first three are relative to `playerId`, so one rule instance can be shared between players as the preset catalogue requires; the fourth names a fixed player, so a level can script a chain between particular colours.
3. Create `src/simulation/rule/ConversionRule.ts` implementing `Rule`, with `create(target, trigger, counts)` validating its arguments and `matches` checking the target selector against `grid[y][x].value` first and counting trigger-selected Moore neighbours only when the target matches. Checking the target first avoids the neighbour walk for the cells the rule cannot apply to.
4. Add `src/simulation/rule/selector/index.ts`, and export `ConversionRule` and the selectors from `src/simulation/rule/index.ts` and `src/simulation/index.ts`, matching how `SumRule` and `GeometryRule` are exported.
5. Add `tests/simulation/rule/selector/CellSelectors.test.ts` and `tests/simulation/rule/ConversionRule.test.ts`, modelled on `tests/simulation/rule/SumRule.test.ts`.

**Post-condition**: A `ConversionRule` can be given to any player and evaluated by both existing rule-application strategies; no existing file's behaviour has changed, and in the global mode an unconverted cell still goes empty.

### Phase 2 — Keep a cell's value when nothing converts it

**Pre-condition**: Phase 1 is complete. `CellClaim.resolve` returns `null` when `buildCandidates` returns no candidate, and `ConfigurableSimulationMode.nextGeneration` writes that `null` as the cell's value.

1. Create `src/simulation/claim/application/PersistentValueRuleSetApplicationStrategy.ts` as a decorator holding an `inner: RuleSetApplicationStrategy`. In `buildCandidates`, return the inner candidates when the list is non-empty; otherwise look up `grid[y][x].value` in `players` and, when found, return `[{ player, rosterIndex, matchedRuleCount: 0 }]`. This keeps the value without changing the `RuleSetApplicationStrategy` interface, `CellClaim` or `ConfigurableSimulationMode`, and a matching conversion rule always beats the incumbent because the incumbent is offered only when nothing matched.
2. Implement `resolveOwner` by delegating to `inner`, so the decorator adds value persistence without altering the inner strategy's ownership behaviour.
3. Update the JSDoc on `ClaimCandidate.matchedRuleCount` and on `CellClaimResolutionStrategy.selectWinner` to state that a fallback incumbent may appear with a count of `0`. All six resolution strategies already return a sole candidate unchanged (verified by reading each `selectWinner`), so no strategy code changes.
4. Create `src/simulation/mode/ConversionSimulationMode.ts` as a static-only preset factory mirroring `GlobalSimulationMode`, pairing `SweepAllCellsIterationStrategy` with the decorator around `UnrestrictedRuleSetApplicationStrategy`. The sweep is required because a cell must be visited to be carried into the next grid.
5. Export the strategy from `claim/application/index.ts`, `claim/index.ts` and `simulation/index.ts`, and the mode from `mode/index.ts` and `simulation/index.ts`.
6. Add `tests/simulation/claim/application/PersistentValueRuleSetApplicationStrategy.test.ts`, `tests/simulation/mode/ConversionSimulationMode.test.ts` and `tests/integration/ConversionGame.test.ts`. The integration test builds a small grid directly and asserts the front position after each generation, the persistence of untouched cells, the catalyst case, and the fallback under each of the six claim strategies.

**Post-condition**: A simulation created with `ConversionSimulationMode.create()` holds every cell's value until a rule converts it. The global and player-local modes behave exactly as before, confirmed by the existing test suite passing unchanged. Depends on Phase 1.

### Phase 3 — Let a level fix its mode, and script Level 4

**Pre-condition**: Phase 2 is complete. A `Level` carries a claim strategy but no mode; `createSimulation` takes the mode as an argument supplied from the configuration screen.

1. In `src/simulation/level/Level.ts`, add `readonly mode: SimulationMode | null`, a trailing optional `mode` parameter on `create` defaulting to `null`, and the matching private-constructor parameter. Levels 1–3 and `createCustomLevel` pass nothing and are unaffected.
2. In `Level.createSimulation`, pass `this.mode ?? mode` to `SimulationOptions.create`, and call `applyStartPositioning` only when `this.mode === null`. A level that fixes its mode must not be given positions chosen for a different mode, and `applyStartPositioning` throws for a player that owns no cell, which Level 4's fifth participant does not.
3. Create `src/simulation/level/LevelFour.ts` with this roster: human `1` "Player 1"; computer `2` "Gas" with no rules; computer `3` "Converter" with `ConversionRule(specific 2, own, [2..8])`; computer `4` "Catalyst" with no rules; computer `5` "Product" with `ConversionRule(specific 3, specific 4, [1..8])` and `ConversionRule(specific 3, own, [2..8])`.
4. In the same file, build `LEVEL_FOUR_STARTING_PATTERN` with `RectanglesStartingPattern.create`, listing the small regions first because the first matching region wins: eight 1x1 Catalyst cells at (30,30), (70,30), (30,70), (70,70), (50,20), (50,80), (25,50), (75,50); a 10x10 human block at (10,45); a 6x6 Converter block at (47,47); then a 100x100 Gas rectangle at (0,0). Product starts with no cells and appears only beside a Catalyst.
5. Create `LEVEL_FOUR` with `Level.create(4, "Level 4", 100, 100, ROSTER, LEVEL_FOUR_STARTING_PATTERN, undefined, ConversionSimulationMode.create())`, and export it with its pattern from `level/index.ts` and `simulation/index.ts`.
6. Add `tests/simulation/level/LevelFour.test.ts` modelled on `LevelThree.test.ts`, and extend `tests/simulation/level/Level.test.ts` under its existing "mode and positioning" block.

**Post-condition**: `LEVEL_FOUR.createSimulation(rules)` runs the conversion mode whatever mode is passed in, and a headless run shows the Converter spreading through Gas and Product appearing around each Catalyst cell it reaches. Depends on Phase 2.

### Phase 4 — Publish the mode, presets and level on the configuration screen

**Pre-condition**: Phase 3 is complete. The configuration screen reads its options from the `AVAILABLE_*` catalogues and builds `GameConfiguration.mode` and `.startPositioning` from the mode controls alone. Load the `gui-design-program` skill before changing anything under `src/gui/`.

1. Append the three conversion presets to `src/gui/AvailableRulePresets.ts`, the `Cells keep their value` entry to `src/gui/AvailableRuleSetApplications.ts`, the `Conversion simulation` entry to `src/gui/AvailableSimulationModes.ts`, and `LEVEL_FOUR` to `src/gui/AvailableLevels.ts`. Every new entry goes last, so index `0` of each catalogue still reproduces today's default game.
2. In `src/gui/GameParticipants.ts`, add `LEVEL_ONLY_PLAYER_COLORS` with one colour for id 5 and spread it into `PLAYER_COLORS` after the computer colours. It is kept out of `COMPUTER_PLAYER_COLORS` because `createGameParticipants` creates one computer player per entry of that array.
3. Create `src/gui/LevelModeSelection.ts` with `resolveEffectiveMode` and `resolveEffectiveStartPositioning`, and export both from `src/gui/index.ts`. They are pure functions outside the screen so they can be tested in the project's node test environment, as `CustomSimulationModeSelection.ts` already is.
4. In `src/gui/screens/GameConfigurationScreen.ts`, change the "Start game" handler to resolve the level once and pass `resolveEffectiveMode(level, this.resolveSelectedMode())` and `resolveEffectiveStartPositioning(level, this.resolveSelectedStartPositioning())`. With positioning `null`, `GamePlayingScreen.show` does not attach the keyboard controller.
5. In the level `<select>` change handler, when the selected level has a non-null `mode`, hide the mode, custom-mode and positioning controls with the same `style.display` toggle the custom controls use, and show a notice line built from the design programme's existing classes; restore the controls for any other level. Reset the notice in `show()` with the other selections.
6. Update `tests/gui/AvailableRuleSetApplications.test.ts`, `AvailableSimulationModes.test.ts`, `AvailableLevels.test.ts` and `GameParticipants.test.ts`; add `tests/gui/AvailableRulePresets.test.ts` and `tests/gui/LevelModeSelection.test.ts`.
7. Update `README.md` as listed in the Documentation Plan.

**Post-condition**: The configuration screen offers the conversion mode, the three conversion presets, the new rule-set application in the custom selector, and Level 4, which always plays in the conversion mode. Depends on Phase 3.

## Testing

### TypeScript unit tests

New test files: `tests/simulation/rule/selector/CellSelectors.test.ts`, `tests/simulation/rule/ConversionRule.test.ts`, `tests/simulation/claim/application/PersistentValueRuleSetApplicationStrategy.test.ts`, `tests/simulation/mode/ConversionSimulationMode.test.ts`, `tests/simulation/level/LevelFour.test.ts`, `tests/integration/ConversionGame.test.ts`, `tests/gui/AvailableRulePresets.test.ts`, `tests/gui/LevelModeSelection.test.ts`.

Updated test files: `tests/simulation/level/Level.test.ts`, `tests/gui/AvailableRuleSetApplications.test.ts`, `tests/gui/AvailableSimulationModes.test.ts`, `tests/gui/AvailableLevels.test.ts`, `tests/gui/GameParticipants.test.ts`.

- [x] Unit tests added/updated
- [x] Integration tests added/updated
- [x] All tests passing (`npm run test`)

**Status**: implemented; automated checks pass, manual validation not yet done.

| Command | Result |
|---------|--------|
| `npm run lint` | passes, no warnings |
| `npm run build` | passes (existing >500 kB chunk-size warning only) |
| `npm run typecheck` | passes |
| `npm run test` | 57 files, 494 tests passed |

A headless 60-generation run of Level 4 showed the Converter growing from 36 to about 2,100 cells, Product first appearing between generations 20 and 30 as the front reached the Catalysts, and Product reaching about 7,000 cells by generation 60.

**Test coverage**: every new class gets its own test file covering success and failure paths; the integration test covers the two behaviours the PR exists for (a front advancing, a catalyst producing a third colour).

### Manual validation steps

| # | Check | How to verify |
|---|-------|---------------|
| 1 | Conversion wave | `npm run dev`, choose **Level 4**, start. The Converter block grows outward through the Gas each generation. |
| 2 | Cells persist | In the same game, Gas cells away from any front keep their colour; no cell turns black. |
| 3 | Catalyst | When the Converter front reaches a Catalyst cell, cells of the fifth colour appear around it and spread through Converter territory; the Catalyst cell itself never changes. |
| 4 | Level fixes its mode | With **Level 4** selected the mode and positioning controls are hidden and the notice is shown; selecting **Level 1** restores them. |
| 5 | Mode is selectable on its own | Choose **Level 1** with **Conversion simulation** and conversion presets; the game runs and territory is held between generations. |
| 6 | Custom selector | Choose **Custom** mode with **Sweep every cell** and **Cells keep their value**; behaviour matches check 5. |
| 7 | Existing modes unchanged | **Level 1** with **Global simulation** and the original presets plays as before and still reaches game over. |
| 8 | Exit | A Level 4 game can be left through the existing exit control. |

## Documentation Plan

| File | Changes |
|------|---------|
| `README.md` | "Rule-set application strategy": add `PersistentValueRuleSetApplicationStrategy` and note that it wraps another strategy. "Game modes": add a **Conversion simulation** row and a `#### Conversion simulation` subsection describing persistence, `ConversionRule` and the four selectors, with one worked example of a takeover and one of a catalyst. "Levels": add `#### Level 4` with its roster, rules and layout, and extend "Choosing a level" to say that a level may fix its game mode. Rule-preset documentation: add the three conversion presets. |

## Related Issues
Closes #32

## Checklist
- [ ] Code follows project conventions (static factory methods, TypeUtils validation, etc.)
- [ ] TypeScript types are correct (`npm run typecheck` passes)
- [ ] Code lints without errors (`npm run lint` passes)
- [ ] All tests pass (`npm run test` passes)
- [ ] Build succeeds (`npm run build` passes)
- [ ] JSDoc comments added for public APIs
- [ ] Updated documentation (if applicable)
- [ ] No breaking changes (or documented in PR description)
- [ ] Commit messages follow Conventional Commits format

## Additional Notes

- **Issue number**: no issue exists for this work yet. `#32` is the next free number and is assumed here and in the filename; adjust both if the issue is created under a different number.
- **A conversion game does not end by itself**: the conversion mode keeps every cell alive, so the "no living cells" game-over never triggers and no hi-score is recorded for such a game. The player leaves through the existing exit. An end condition (the grid stops changing, or one player holds every cell) is follow-up work.
- **Nothing moves**: this PR has no attraction or repulsion. A catalyst is a stationary cell and the colour that forms around it does not travel or merge. Clustering needs continuous-position particles, which is a separate change.
- **Existing presets under the conversion mode**: `SumRule` does not look at the resolved cell's value, so a "Born" preset already takes other players' cells when its neighbour count is met, and a "Survive" preset becomes redundant because cells persist anyway.
- **Random computer rules**: in a custom game each computer player draws three presets at random from `AVAILABLE_RULE_PRESETS`, so it may now draw conversion presets. In the global mode they act as extra takeover rules.
- **Level 4 values are a starting point**: the block sizes, Catalyst positions and neighbour counts are chosen to make the two waves visible, and may need tuning during manual validation.
- **The rule is owned by the beneficiary**: "Product takes Converter cells beside a Catalyst" is Product's rule, not the Catalyst's. A catalyst player has no control over the conversions it triggers.
