# feat(simulation): expand unclaimed-cell claiming with state, input and environmental mechanisms

> **This is an epic tracking document, not a single mergeable diff.** It scopes three foundation
> phases and four child pull requests. Phases 1–3 must land before any mechanism in Phases 4–7 can be
> built. Each of Phases 4–7 is intended to be opened as its own PR with its own description generated
> from this document.

## Summary

Delivers the seven cell-claiming mechanisms descoped from #25 by first making the cell model capable
of expressing them: `value` collapses into an `alive` flag, a sparse per-cell state layer tracks how
long a cell has been alive, and a seeded random generator is injected through the simulation. Four
child PRs then add Contagion and Overflow, Cultural Pressure Drift, a conquest mode carrying Seeds and
Colonizers, and the Wildfire and Spore environmental events.

## Motivation

#25 shipped the `UnclaimedCellStrategy` seam with the only two mechanisms that are pure functions of
the current grid. The other seven were blocked, each on a limitation of the model rather than on
design uncertainty:

- **`value` cannot express a live cell nobody owns.** It *is* a player id — `Simulation.getCellCounts`
  does `counts.set(cell.value, …)` — so a neutral active cell would score for a player id that does
  not exist. Wildfire is unimplementable until this changes.
- **The grid holds no history.** Contagion needs to know a cell transitioned from dead to alive, and
  Cultural Pressure needs how many consecutive generations a cell has stayed alive. A single grid
  answers neither.
- **Nothing consults randomness.** The README guarantees *"from pressing 'Start game' to the grid
  dying, no randomness is consulted."* Spores and Wildfire both require it.
- **No mode permits input-driven claiming.** `GlobalSimulationMode` documents that positions are
  ignored and a game is fully determined by the pattern and the rules; `PlayerLocalSimulationMode`
  guarantees a player can never take territory and can only birth into empty space by standing on it.
  Seeds and Colonizers violate one contract or the other.

Building any single mechanism against the current model means special-casing it. Building the
foundation once means all seven become ordinary strategy implementations.

## Changes

All files below are prospective — no code has been written. Grouped by the phase that touches them.

### Files Deleted

- None

### Files Updated

**Phase 1 — cell model**

- **`src/simulation/Cell.ts`** — Replace `value: number | null` with `alive: boolean`. `ownerId` remains the persistent claim; a live cell is `alive` with any `ownerId`, including `null` for neutral.
- **`src/simulation/rule/SumRule.ts`** — Neighbour test becomes `cell.ownerId === playerId && cell.alive` in place of `cell.value === playerId`.
- **`src/simulation/rule/GeometryRule.ts`** — Same substitution in the pattern comparison.
- **`src/simulation/Simulation.ts`** — `getCellCounts` counts `ownerId` where `alive`; `hasLivingCells` tests `alive`; `setCell`, `seedRandom` and `applyStartingPattern` write the new shape.
- **`src/simulation/claim/CellClaim.ts`** — Result carries `ownerId` and `alive` rather than a value.
- **`src/simulation/mode/GlobalSimulationMode.ts`**, **`src/simulation/mode/PlayerLocalSimulationMode.ts`** — Write the new cell shape.
- **`src/simulation/claim/IncumbentClaimStrategy.ts`**, **`NeighbourMajorityClaimStrategy.ts`**, **`ContestedCellVoidStrategy.ts`** — Update any read of `value`.
- **`src/gui/SimulationRenderer.ts`** — Colour selection keys off `ownerId` with `alive` choosing between full and toned-down colour; a neutral live cell takes a new neutral colour.

**Phase 2 — state layer**

- **`src/simulation/state/CellStateLayer.ts`** *(new)* — Sparse `Map` from cell index to `consecutiveAliveGenerations`, plus colonizer designations. Only cells with non-default state are stored.
- **`src/simulation/Simulation.ts`** — Owns the layer, advances it each generation, and clears it in `applyStartingPattern`, `setCell` and `seedRandom`.
- **`src/simulation/mode/GenerationContext.ts`** — Carries a readonly view of the layer.

**Phase 3 — randomness**

- **`src/simulation/RandomGenerator.ts`** *(new)* — `type RandomGenerator = () => number`, matching the shape `RandomClaimedCellPositioning` already accepts.
- **`src/simulation/SimulationOptions.ts`**, **`src/simulation/Simulation.ts`** — Optional generator defaulting to `Math.random`.
- **`src/simulation/mode/GenerationContext.ts`** — Carries the generator.

**Phase 4 — Contagion and Overflow**

- **`src/simulation/claim/ContagionConversionStrategy.ts`** *(new)* — Converts a neutral cell adjacent to a cell whose counter is exactly 1.
- **`src/simulation/claim/OverflowConversionStrategy.ts`** *(new)* — Converts when an adjacent owned cell is alive and all of that cell's owned neighbours are alive.

**Phase 5 — Cultural pressure**

- **`src/simulation/claim/CulturalPressureStrategy.ts`** *(new)* — Converts a neutral cell adjacent to an owned cell whose counter has passed the configured limit.

**Phase 6 — Conquest mode**

- **`src/simulation/mode/ConquestSimulationMode.ts`** *(new)* — Player-local evaluation plus seed placement and colonizer advance.
- **`src/simulation/player/SeedBudget.ts`** *(new)* — Per-player token count, replenished every X generations.
- **`src/simulation/mode/ColonizerAdvance.ts`** *(new)* — Advances each designated colonizer one cell along its direction until blocked.
- **`src/gui/PlayerInputController.ts`** — Additional keys for spending a seed and designating a colonizer.
- **`src/gui/AvailableSimulationModes.ts`** — Registers the new mode.

**Phase 7 — Environmental events**

- **`src/simulation/environment/WildfireEvent.ts`** *(new)* — Periodically toggles neutral cells alive; a neutral live cell adjacent to a player's live boundary cell is absorbed.
- **`src/simulation/environment/SporeField.ts`** *(new)* — Spawns neutral spores; a player's live cell touching one converts a radius of neutral territory.
- **`src/simulation/mode/GenerationContext.ts`** — Carries the environmental events for modes that run them.

**Documentation**

- **`README.md`** — Rewrites the cell-model description, amends the determinism guarantee, and documents the new mode and the seven mechanisms.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [x] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [x] Documentation update
- [x] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Test coverage improvement

Phase 1 is a breaking change to the `Cell` interface, which is exported from `src/simulation`. Phase 3
narrows the determinism guarantee from "no randomness" to "reproducible given a seed".

## Implementation Plan

### Phase 1 — Collapse value into an alive flag

**Pre-condition**: #25 is merged, so `UnclaimedCellStrategy` exists and claims persist in global mode.

**Steps**:

1. In `src/simulation/Cell.ts`, replace `value: number | null` with `alive: boolean`, because `value`
   today is either `null` or exactly `ownerId` and therefore carries a single bit in a `number | null`.
   Document that `ownerId === null && alive` is the neutral live cell Wildfire needs.
2. In `src/simulation/rule/SumRule.ts` and `src/simulation/rule/GeometryRule.ts`, change the neighbour
   test from `grid[ny][nx].value === playerId` to `grid[ny][nx].ownerId === playerId && grid[ny][nx].alive`,
   preserving today's semantics that a dormant cell is not a live neighbour.
3. In `src/simulation/Simulation.ts`, rewrite `getCellCounts` to count `cell.ownerId` where `cell.alive`,
   rewrite `hasLivingCells` to test `cell.alive`, and update `setCell`, `seedRandom` and
   `applyStartingPattern` to write `{ ownerId: id, alive: id !== null }`.
4. Change `CellClaim.resolve`'s result to carry `ownerId` and `alive`, and update both modes to write it.
5. In `src/gui/SimulationRenderer.ts`, select the colour from `ownerId` and use `alive` to choose between
   the full and the `TONED_DOWN_BLEND` colour; add a neutral colour for `ownerId === null && alive`.
6. Update every test that constructs a cell literal to the new shape.

**Post-condition**: The grid can represent a live cell owned by nobody, and no behaviour has changed
for any existing level.

**Dependencies**: #25.

### Phase 2 — Introduce the sparse cell-state layer

**Pre-condition**: Phase 1 complete.

**Steps**:

1. Add `src/simulation/state/CellStateLayer.ts` holding a `Map<number, number>` from `y * width + x` to
   `consecutiveAliveGenerations`, plus a `Map<number, Direction>` of colonizer designations. Sparse
   because only frontier cells carry non-zero state, keeping the per-generation cost off the 10,000-cell
   hot path.
2. Give it `advance(previous: Grid, next: Grid): void`, incrementing the counter for cells alive in both
   and deleting the entry for cells that died, so a cell that just turned on reads exactly 1 — which is
   the Contagion predicate — and a long-held cell reads high, which is the Pressure predicate. One
   counter therefore serves both mechanisms.
3. Give it `clear(): void` and call it from `Simulation.applyStartingPattern`, `setCell` and
   `seedRandom`, because accumulated pressure surviving a grid reset would leak between games.
4. Add a readonly view of the layer to `src/simulation/mode/GenerationContext.ts` so strategies can read
   counters without being able to mutate them mid-sweep.
5. Have `Simulation.run` call `advance` after the new grid is computed and before the generation counter
   increments, so a strategy always reads counters describing the grid it is resolving against.

**Post-condition**: Any strategy can ask how long a cell has been continuously alive, and the state is
reset with the grid.

**Dependencies**: Phase 1.

### Phase 3 — Inject a seeded random generator

**Pre-condition**: Phase 2 complete.

**Steps**:

1. Add `src/simulation/RandomGenerator.ts` exporting `type RandomGenerator = () => number`, matching the
   shape `RandomClaimedCellPositioning.create` already accepts, so the project has one RNG convention
   rather than two.
2. Add an optional `random` to `SimulationOptions.create`, defaulting to `Math.random`, and store it on
   `Simulation`.
3. Expose it on `GenerationContext` so environmental events can consult it without reaching for the
   global.
4. Replace the direct `Math.random()` call in `Simulation.seedRandom` with the injected generator, so
   seeding a grid is reproducible under a seeded run.

**Post-condition**: Every source of randomness inside the simulation flows through one injected
generator, and a seeded generator makes a whole run reproducible.

**Dependencies**: Phase 2.

### Phase 4 — Contagion and Cellular Overflow *(child PR)*

**Pre-condition**: Phases 1–3 complete.

**Steps**:

1. Add `src/simulation/claim/ContagionConversionStrategy.ts` implementing `UnclaimedCellStrategy`. For a
   neutral cell it scans the 8 wrapped neighbours for owned cells whose state-layer counter equals 1 —
   the cells that turned on this generation — and converts to the owner holding the most such cells.
   This restates the request's *push* ("a cell that turns on claims its neighbours") as an equivalent
   *pull*, which is required because `SimulationMode` forbids writing to cells other than the one being
   resolved.
2. Add `src/simulation/claim/OverflowConversionStrategy.ts`. For a neutral cell it looks for an adjacent
   owned live cell all of whose owned neighbours are also alive, matching the request's "excess energy
   spills over".
3. Guard the cost of step 2: it is up to 64 neighbourhood reads per neutral cell, so cache each donor
   cell's saturation per generation rather than recomputing it for each of its neutral neighbours.
4. Register both in `src/gui/AvailableUnclaimedStrategies.ts` and export from
   `src/simulation/claim/index.ts`.

**Post-condition**: Two further expansion options appear in the custom-level Expansion picker.

**Dependencies**: Phases 1–3.

### Phase 5 — Cultural pressure drift *(child PR)*

**Pre-condition**: Phase 4 complete.

**Steps**:

1. Add `src/simulation/claim/CulturalPressureStrategy.ts` with `create(limit: number, fallback: ClaimStrategy)`,
   converting a neutral cell when an adjacent owned cell's counter has passed `limit`.
2. Sum the pressure of all of a player's adjacent cells rather than taking the maximum, so a broad
   settled frontier expands sooner than a single long-lived cell — which is what "cultural pressure"
   implies.
3. Delegate ties to the injected `ClaimStrategy` fallback, consistent with every other conversion strategy.
4. Register it in `src/gui/AvailableUnclaimedStrategies.ts`.

**Post-condition**: Territory that has been held continuously expands on its own, at a rate set by `limit`.

**Dependencies**: Phase 4 (for the shared neighbour-tally helper introduced there).

### Phase 6 — Conquest mode with seeds and colonizers *(child PR)*

**Pre-condition**: Phases 1–3 complete.

**Steps**:

1. Add `src/simulation/mode/ConquestSimulationMode.ts` implementing `SimulationMode`. It evaluates each
   player's owned cells as `PlayerLocalSimulationMode` does, then applies pending seed placements and
   advances colonizers. A new mode rather than an amendment because both existing modes document
   guarantees that seeds and colonizers break.
2. Add `src/simulation/player/SeedBudget.ts` holding per-player token counts, replenished every X
   generations, with `spend(playerId): boolean` returning false when the budget is exhausted.
3. Add `src/simulation/mode/ColonizerAdvance.ts` moving each designated colonizer one cell along its
   stored direction per generation, claiming the target when neutral and halting when blocked by another
   player's territory.
4. Extend `src/gui/PlayerInputController.ts` with a key that spends a seed at the player's position and a
   key that designates the occupied cell as a colonizer, keeping all keyboard handling in the one class
   that owns the `keydown` listener.
5. Register the mode in `src/gui/AvailableSimulationModes.ts` so it appears in the Game mode selector.

**Post-condition**: A player can spend a budget to claim neutral cells directly and designate cells that
expand autonomously, without either existing mode changing.

**Dependencies**: Phases 1–3. Independent of Phases 4–5, so it can proceed in parallel.

### Phase 7 — Wildfire and spores *(child PR)*

**Pre-condition**: Phases 1–3 complete; Phase 1 in particular, since both mechanics need neutral live cells.

**Steps**:

1. Add `src/simulation/environment/WildfireEvent.ts` toggling neutral cells alive on a fixed generation
   period, then absorbing any neutral live cell adjacent to a player's live boundary cell. The request
   leaves the "global heat rules" unspecified; a generation-periodic toggle is the simplest reading and
   is called out as an open question below.
2. Add `src/simulation/environment/SporeField.ts` spawning neutral spores at a configured rate through
   the injected generator, converting a radius of neutral territory when a player's live cell touches one.
3. Thread both through `GenerationContext` and run them from the mode after cell resolution, so they act
   on the completed next grid rather than racing the per-cell sweep.
4. Amend the README determinism section to state that these mechanisms consult the injected generator and
   that a run is reproducible given its seed.

**Post-condition**: The grid itself creates claim opportunities, and a seeded run remains reproducible.

**Dependencies**: Phases 1–3.

## Testing

### TypeScript unit tests

Per phase:

- **Phase 1** — Every existing test in `tests/` that constructs a cell literal is migrated. New cases in `tests/simulation/Simulation.test.ts` assert a neutral live cell scores for nobody and still counts as living for `hasLivingCells`.
- **Phase 2** — `tests/simulation/state/CellStateLayer.test.ts`: counter reads 1 the generation a cell turns on; increments while it stays alive; the entry is deleted when it dies; `clear` empties the layer; a grid reset through each of `applyStartingPattern`, `setCell` and `seedRandom` clears it.
- **Phase 3** — `tests/simulation/Simulation.test.ts`: two simulations built with the same seeded generator produce identical grids for 50 generations.
- **Phase 4** — `tests/simulation/claim/ContagionConversionStrategy.test.ts` and `OverflowConversionStrategy.test.ts`: convert and no-convert paths, tie delegation, edge wrapping, and that a long-lived neighbour does *not* trigger contagion.
- **Phase 5** — `tests/simulation/claim/CulturalPressureStrategy.test.ts`: below limit, at limit, summed pressure beats a single high counter, tie delegation.
- **Phase 6** — `tests/simulation/mode/ConquestSimulationMode.test.ts` and `tests/simulation/player/SeedBudget.test.ts`: an exhausted budget refuses placement, a seed cannot target owned territory, a colonizer halts when blocked, and budgets replenish on schedule.
- **Phase 7** — `tests/simulation/environment/WildfireEvent.test.ts` and `SporeField.test.ts` with a stub generator returning a fixed sequence, asserting absorption and radius conversion.

Integration: `tests/integration/ConquestGame.test.ts` *(new)* plays a scripted conquest game; the existing `LevelOneGame` and `ClaimStrategyGame` suites are re-baselined once in Phase 1.

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests passing (`npm run test`)

**Test coverage**: Every new strategy is covered on convert and no-convert paths plus tie delegation.
The state layer is covered on all three reset routes. Randomness is covered with a stubbed generator so
no test depends on `Math.random`.

**Status**: **Not run — no implementation exists yet.** This is a planning document produced before any
code was written. `npm run lint`, `npm run test`, `npm run build` and `npm run typecheck` have not been
executed for this work. Each child PR must gather and paste its own evidence; no box above may be ticked
in this document.

### Manual validation steps

| # | Check | How to verify |
|---|-------|---------------|
| 1 | Phase 1 changes no behaviour | Run Levels 1–3 in both existing modes and confirm each dies on the same generation as before the refactor. |
| 2 | Neutral live cells render distinctly | Trigger Wildfire and confirm neutral live cells use the neutral colour, not a player colour. |
| 3 | Scores ignore neutral life | Confirm the scoreboard total does not rise while only neutral cells are alive. |
| 4 | State layer resets | Play a game, return to configuration, start a new one, and confirm no territory expands on generation 1 from stale pressure. |
| 5 | Seeded runs reproduce | Run the same seed twice and confirm identical death generations. |
| 6 | Contagion fires once | Confirm a cell that turns on converts neighbours that generation only, not while it stays on. |
| 7 | Seed budget is enforced | Spend every token and confirm further presses do nothing until replenishment. |
| 8 | Colonizer halts | Point a colonizer at another player's territory and confirm it stops at the boundary. |
| 9 | Frame budget holds | Run 100x100 at fastest speed with Overflow selected and confirm no stutter. |

## Documentation Plan

| File | Changes |
|------|---------|
| `README.md` | Rewrite the cell description for `{ ownerId, alive }`, including the neutral live cell. Amend the determinism section from "no randomness is consulted" to "reproducible given a seed", naming which mechanisms consult it. Add a "Conquest" entry to the game-mode table with its seed and colonizer controls, and extend the in-game controls table. Extend the unclaimed-cell conversion table added by #25 with Contagion, Overflow and Cultural pressure. Add an "Environmental events" subsection for Wildfire and Spores. |

## Related Issues

Closes #26
Related to #25
Related to #24

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

No box is ticked: this is a planning document and no code has been written. The breaking-change box is
deliberately left unticked because the break *is* documented above, in Type of Change and in Phase 1.

## Additional Notes

### How the request was reinterpreted

Two mechanisms could not be built as literally described, and are restated rather than dropped:

- **Contagion** was described as a push — a cell turning on "broadcasts a pulse that claims all adjacent
  cells". `SimulationMode` requires that every cell of one generation be read before any cell of the next
  is written, and resolution is strictly per-cell. Phase 4 implements the identical outcome as a pull: a
  neutral cell asks whether any neighbour just turned on. The observable behaviour matches; the write
  discipline is preserved.
- **Cultural pressure** was described as a hidden per-player value on perimeter cells. Phase 2 stores a
  single `consecutiveAliveGenerations` counter per cell instead, since pressure as described is a
  function of exactly that. The same counter also supplies Contagion's predicate, so one structure serves
  both mechanisms.

### Accepted design risk

Pressure counters live in `CellStateLayer`, outside the `Grid`. `Simulation.getGrid()` therefore stops
being a complete snapshot of simulation state, and a game cannot be reconstructed from a grid alone.
This was chosen over storing counters on `Cell` to keep the 10,000-cell-per-generation allocation to two
fields. The mitigation is that the layer is cleared on all three grid-reset routes and is covered by
dedicated tests; reviewers should treat any new grid-reset path as requiring a matching `clear()` call.

### Suggested merge order

Phases 1, 2 and 3 are strictly sequential and should land as one foundation PR or three small ones.
Phases 4–5 and Phases 6–7 are independent of each other afterwards and can proceed in parallel. Phase 1
carries the highest conflict risk against the in-flight #24 and #25 branches and should be scheduled
immediately after #25 merges.
