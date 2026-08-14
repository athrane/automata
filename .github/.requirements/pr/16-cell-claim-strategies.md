# feat(simulation): externalize cell claim resolution behind a claim strategy

## Summary

Extracts the two decisions `Simulation.run` currently hard-codes — which players are candidates for a cell, and which candidate wins it — into a `CellClaim` resolver and a `ClaimStrategy` interface. Adds six interchangeable strategies for computing the winning player, from the behaviour-preserving `FirstMatchClaimStrategy` to incumbency, match strength, neighbourhood majority, rotating priority, and mutual annihilation. The default strategy reproduces today's grid exactly, so no existing run changes.

## Motivation

`Simulation.run` decides cell ownership inline, in eleven lines that fuse two unrelated policies:

```ts
for (const player of this.players) {
  const isMatch = player.rules.some((rule) => rule.matches(this.grid, x, y, player.id));
  if (isMatch) { nextGrid[y][x] = player.id; break; }
}
```

The `.some(...)` fixes how one player's rules combine — OR — and the `break` fixes how a contest between players is settled: the player at the lowest index of `this.players` wins, unconditionally. Neither policy is named, neither is testable in isolation, and neither can be varied without editing the generation loop that every other behaviour in the project depends on.

Three concrete problems follow. First, the tiebreak is positional rather than declared: `Level.createPlayers` returns `[human, ...computers]`, so the human player wins every contested cell in every level, permanently, and a level that ordered its roster differently would silently change the game. Second, because the loop breaks on the first match, no candidate list ever exists — there is no place to express "the strongest match wins", "the current occupant defends its cell", or "a contested cell dies", because by the time a second player could be considered the decision is already made. Third, the rule combination is OR by necessity rather than by choice, and the comment above `run` has to explain that choice because the code cannot.

This PR gives both decisions a name and a seam. Making the candidate list explicit is what turns "who wins a cell" into a question the codebase can answer differently per level, and adding a new claim policy becomes adding a class rather than editing `Simulation`.

## Changes

### Files Deleted

- None

### Files Updated

- **`src/simulation/claim/ClaimContext.ts`** *(new file)* — `ClaimContext` interface describing the cell being resolved: `readonly grid: Grid`, `readonly x: number`, `readonly y: number`, `readonly owner: Cell` (the cell's owner in the generation being read), `readonly generation: number`, and `readonly playerCount: number`. Passing a context object rather than six positional arguments keeps strategy signatures stable as later strategies need more of the surrounding state. `owner` is what makes incumbency expressible; `generation` and `playerCount` are what make a deterministic rotation expressible.
- **`src/simulation/claim/ClaimCandidate.ts`** *(new file)* — `ClaimCandidate` interface: `readonly player: Player`, `readonly rosterIndex: number`, `readonly matchedRuleCount: number`. This is the candidate list the current code never builds. `matchedRuleCount` records *how many* of the player's rules fired, not just that one did, which is the input `StrongestMatchClaimStrategy` needs; `rosterIndex` preserves the player's position in the roster so a strategy can reason about priority without depending on the order of the candidate array.
- **`src/simulation/claim/ClaimStrategy.ts`** *(new file)* — `ClaimStrategy` interface with one method, `selectWinner(candidates: ReadonlyArray<ClaimCandidate>, context: ClaimContext): Cell`, and one declared requirement, `readonly needsAllCandidates: boolean`. Documented contract: `candidates` is non-empty and ordered by `rosterIndex` ascending; the return value must be the `id` of one of the candidates, or `null` to leave the cell empty. `needsAllCandidates` lets a strategy that decides from the first match alone — only `FirstMatchClaimStrategy` — keep the short circuit the old generation loop had; see the Phase 4 outcome under Additional Notes for the measurement that made it necessary.
- **`src/simulation/claim/CellClaim.ts`** *(new file)* — `CellClaim` class with a private constructor and `static create(strategy: ClaimStrategy): CellClaim`. Its `resolve(grid, x, y, players, generation): Cell` builds the candidate list by counting, for each player, how many of that player's rules match — a player with a count above zero is a candidate, which is exactly today's OR expressed as data — then returns `null` without consulting the strategy when no player matched, and otherwise delegates to `strategy.selectWinner`. Enumeration stops at the first candidate when the strategy declares `needsAllCandidates: false`. This class owns step 3 (candidate gathering); the strategy owns step 4 (winner selection).
- **`src/simulation/claim/FirstMatchClaimStrategy.ts`** *(new file)* — Returns `candidates[0].player.id`. Because candidates are ordered by roster index, this is precisely today's behaviour: lowest roster index wins. The default, and the strategy every other one falls back to.
- **`src/simulation/claim/IncumbentClaimStrategy.ts`** *(new file)* — Returns `context.owner` when the current occupant is among the candidates, otherwise delegates to a fallback `ClaimStrategy` supplied at construction. Makes occupancy defensible: a player can only be displaced when its own rules stop matching, rather than losing a cell to a higher-priority player that merely also qualifies.
- **`src/simulation/claim/StrongestMatchClaimStrategy.ts`** *(new file)* — Selects the candidates with the maximum `matchedRuleCount` and delegates the tied subset to a fallback strategy. Rewards how well a rule set fits the local neighbourhood rather than where the player sits in the roster, so a player with one narrowly-matching rule loses a cell to a player whose three rules all fire on it.
- **`src/simulation/claim/NeighbourMajorityClaimStrategy.ts`** *(new file)* — For each candidate, counts the cells that candidate owns in the toroidal 8-neighbourhood of `(x, y)` using `wrapCoordinate`, keeps the candidates holding the maximum, and delegates ties to a fallback strategy. Ownership follows local territorial support, which removes the permanent roster advantage entirely for any cell where the neighbourhood is not itself tied.
- **`src/simulation/claim/RotatingPriorityClaimStrategy.ts`** *(new file)* — Computes `offset = context.generation % context.playerCount` and returns the candidate minimising `(rosterIndex - offset + playerCount) % playerCount`, so priority rotates through the roster one player per generation. Keeps a total, deterministic order — no randomness — while spreading the first-match advantage evenly over a run instead of granting it to index 0 forever.
- **`src/simulation/claim/ContestedCellVoidStrategy.ts`** *(new file)* — Returns `null` when `candidates.length > 1`, otherwise delegates to a fallback strategy. A contested cell is destroyed rather than awarded, which turns boundaries between players into eroding front lines instead of one player absorbing the other.
- **`src/simulation/claim/index.ts`** *(new file)* — Barrel exporting `CellClaim` and the six strategy classes, plus the `ClaimStrategy`, `ClaimCandidate`, and `ClaimContext` types, matching the `src/simulation/level/index.ts` convention.
- **`src/simulation/Simulation.ts`** — Adds a `private readonly cellClaim: CellClaim` field built from `options.claimStrategy`. The nested `for (const player of this.players)` block in `run` is replaced by `nextGrid[y][x] = this.cellClaim.resolve(this.grid, x, y, this.players, this.generation)`. The reads still come from `this.grid` and the writes still go to `nextGrid`, so the generation stays double-buffered. The JSDoc paragraph explaining the OR combination moves to `CellClaim`, where the combination now lives.
- **`src/simulation/SimulationOptions.ts`** — Adds `readonly claimStrategy: ClaimStrategy` and a fifth optional `claimStrategy` parameter to `create`, defaulting to `FirstMatchClaimStrategy.create()`. Optional and trailing, so every existing call site compiles unchanged and keeps its current behaviour.
- **`src/simulation/level/Level.ts`** — Adds `readonly claimStrategy: ClaimStrategy` and a seventh optional `claimStrategy` parameter to `create`, defaulting to `FirstMatchClaimStrategy.create()`. `createSimulation` forwards it to `SimulationOptions.create`. A level already fixes the grid, the starting pattern, and the computer rule sets; how a contested cell is settled belongs in the same definition, since it changes the character of a level as much as its rules do.
- **`src/simulation/index.ts`** — Re-exports `CellClaim` and the six strategies, and the three new types, from `./claim`.
- **`tests/simulation/claim/CellClaim.test.ts`** *(new file)* — Candidate construction, empty-candidate short circuit, first-match short circuit, and strategy delegation. See Testing.
- **`tests/simulation/claim/FirstMatchClaimStrategy.test.ts`** *(new file)*
- **`tests/simulation/claim/IncumbentClaimStrategy.test.ts`** *(new file)*
- **`tests/simulation/claim/StrongestMatchClaimStrategy.test.ts`** *(new file)*
- **`tests/simulation/claim/NeighbourMajorityClaimStrategy.test.ts`** *(new file)*
- **`tests/simulation/claim/RotatingPriorityClaimStrategy.test.ts`** *(new file)*
- **`tests/simulation/claim/ContestedCellVoidStrategy.test.ts`** *(new file)*
- **`tests/simulation/Simulation.test.ts`** — Adds cases asserting the default strategy reproduces the pre-change grid and that an injected strategy is consulted for every contested cell.
- **`tests/simulation/level/Level.test.ts`** — Adds cases for the strategy default and passthrough into the built simulation.
- **`tests/integration/ClaimStrategyGame.test.ts`** *(new file)* — Runs Level 1 under each strategy and asserts they diverge from one another while each stays deterministic across repeated runs.
- **`README.md`** — Adds a "Cell claim" subsection under "Levels" describing the two-step resolution and the six strategies.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [x] Documentation update
- [x] Refactoring (no functional changes)
- [ ] Performance improvement
- [x] Test coverage improvement

Both new parameters are optional and trailing, and the default strategy is behaviour-identical to the code it replaces, so no existing call site changes and no existing run produces a different grid.

## Implementation Plan

### Phase 1 — Introduce the claim abstractions and the behaviour-preserving strategy

**Pre-condition**: `Simulation.run` resolves cells inline; `src/simulation/` has no notion of a candidate or a claim policy. No dependencies on other phases.

**Steps**:
1. Create `src/simulation/claim/ClaimContext.ts` declaring the `ClaimContext` interface with readonly `grid`, `x`, `y`, `owner`, `generation`, and `playerCount`, importing `Cell` from `../Cell` and `Grid` from `../Grid`. A context object is chosen over positional parameters so that adding state a later strategy needs does not change the signature every strategy implements.
2. Create `src/simulation/claim/ClaimCandidate.ts` declaring `ClaimCandidate` with readonly `player: Player`, `rosterIndex: number`, and `matchedRuleCount: number`. `matchedRuleCount` rather than a boolean is what allows Phase 2's `StrongestMatchClaimStrategy` to exist without re-evaluating rules.
3. Create `src/simulation/claim/ClaimStrategy.ts` declaring `selectWinner(candidates: ReadonlyArray<ClaimCandidate>, context: ClaimContext): Cell`, with JSDoc fixing the contract: `candidates` is non-empty and sorted by `rosterIndex` ascending, and the return must be a candidate's `id` or `null`.
4. Create `src/simulation/claim/CellClaim.ts` with a private constructor storing a `ClaimStrategy`, a `public static create(strategy: ClaimStrategy): CellClaim` throwing `TypeError('strategy must be provided')` when the argument is null or undefined, and `public resolve(grid: Grid, x: number, y: number, players: ReadonlyArray<Player>, generation: number): Cell`.
5. In `resolve`, iterate `players` with the index, count `player.rules.filter((rule) => rule.matches(grid, x, y, player.id)).length`, and push a `ClaimCandidate` when the count is above zero. A count above zero *is* the existing OR combination, now recorded rather than implied.
6. In the same method, return `null` immediately when the candidate array is empty — this both preserves the empty-cell default and lets every strategy assume a non-empty list — and otherwise build the `ClaimContext` with `owner: grid[y][x]` and the supplied `generation`, then return `strategy.selectWinner(candidates, context)`.
7. Create `src/simulation/claim/FirstMatchClaimStrategy.ts` with a private constructor, `static create()`, and `selectWinner(candidates)` returning `candidates[0].player.id`. Since `resolve` builds candidates in roster order, this is the current `break`-on-first-match rule, expressed as a policy rather than as control flow.
8. Create `tests/simulation/claim/CellClaim.test.ts` and `tests/simulation/claim/FirstMatchClaimStrategy.test.ts` per the Testing section, using a stub `ClaimStrategy` that records its arguments to assert candidate ordering, `matchedRuleCount`, and that the strategy is never called for an uncontested empty cell.

**Post-condition**: `CellClaim` resolves a cell for any grid and roster and is tested in isolation. `Simulation` does not use it yet, and its behaviour is unchanged.

### Phase 2 — Add the alternative winning-player strategies

**Pre-condition**: Phase 1 is complete — `ClaimStrategy`, `ClaimCandidate`, `ClaimContext`, and `FirstMatchClaimStrategy` compile. Each strategy below is independent of the others and depends only on Phase 1.

**Steps**:
1. Create `src/simulation/claim/IncumbentClaimStrategy.ts` with a private constructor taking a `fallback: ClaimStrategy`, `static create(fallback)` validating it is present, and `selectWinner(candidates, context)` returning `context.owner` when `context.owner !== null` and some candidate has that id, else `this.fallback.selectWinner(candidates, context)`. The owner must be re-checked against the candidate list rather than trusted, because an occupant whose rules no longer match has to lose the cell.
2. Create `src/simulation/claim/StrongestMatchClaimStrategy.ts` taking a `fallback` the same way. `selectWinner` computes the maximum `matchedRuleCount` across candidates, filters to the candidates holding it, returns that candidate's id when exactly one remains, and otherwise calls `this.fallback.selectWinner(tied, context)`. Delegating the tied subset rather than the full list is what keeps the composition meaningful — the fallback must not be able to pick a candidate this strategy already eliminated.
3. Create `src/simulation/claim/NeighbourMajorityClaimStrategy.ts` taking a `fallback`. For each candidate, count the eight Moore neighbours of `(context.x, context.y)` in `context.grid` equal to that candidate's id, wrapping both axes through `wrapCoordinate` so the count matches the toroidal geometry `SumRule` and `GeometryRule` already use. Keep the maximum-count candidates and delegate ties to the fallback on that subset.
4. Create `src/simulation/claim/RotatingPriorityClaimStrategy.ts` with `static create()` and no fallback — the rotation is already a total order, so ties are impossible. `selectWinner` computes `offset = context.generation % context.playerCount` and returns the candidate with the smallest `(rosterIndex - offset + playerCount) % playerCount`. Using `context.playerCount` rather than `candidates.length` is deliberate: rotating over the roster keeps the offset stable for a whole generation, whereas rotating over the candidate list would advance at a different rate on every cell.
5. Create `src/simulation/claim/ContestedCellVoidStrategy.ts` taking a `fallback`. `selectWinner` returns `null` when `candidates.length > 1` and `this.fallback.selectWinner(candidates, context)` otherwise. Kept as a decorator rather than a standalone policy so it composes with any of the above for the uncontested case.
6. Create `src/simulation/claim/index.ts` exporting `CellClaim`, the six strategies, and the three types.
7. Add one test file per strategy under `tests/simulation/claim/`, each covering its selection rule, its delegation to the fallback, and — for the four decorating strategies — that the fallback receives only the surviving subset.

**Post-condition**: Six strategies exist, each independently tested, each a pure function of the candidates and the context. Nothing constructs them outside their tests.

### Phase 3 — Route the generation loop through `CellClaim`

**Pre-condition**: Phases 1 and 2 are complete. `Simulation.run` still contains the inline player loop, and `SimulationOptions` has no strategy field. This is the only phase that changes observable behaviour wiring.

**Steps**:
1. In `src/simulation/SimulationOptions.ts`, add `readonly claimStrategy: ClaimStrategy`, a fifth optional `claimStrategy?: ClaimStrategy` parameter to `create`, and `const resolvedClaimStrategy = claimStrategy ?? FirstMatchClaimStrategy.create();` alongside the existing `resolved*` locals, then pass it through the private constructor. Trailing and optional so no existing caller changes.
2. In `src/simulation/Simulation.ts`, add `private readonly cellClaim: CellClaim` initialised in the constructor as `CellClaim.create(options.claimStrategy)`, and import `CellClaim` from `./claim/CellClaim`.
3. In the same file, replace the body of the `x` loop in `run` with `nextGrid[y][x] = this.cellClaim.resolve(this.grid, x, y, this.players, this.generation)`, deleting the `for (const player of this.players)` block, the `isMatch` local, and the `break`. Pass `this.generation` — the generation of the grid being read, before the post-sweep increment — so a rotating strategy uses one offset for the whole sweep rather than shifting mid-grid.
4. In the same file, move the JSDoc paragraph explaining the OR combination from `run` onto `CellClaim.resolve`, and replace it on `run` with a sentence stating that each cell is resolved by the configured claim strategy. The explanation should sit with the code that makes the choice.
5. In `src/simulation/level/Level.ts`, add `readonly claimStrategy: ClaimStrategy`, a seventh optional `claimStrategy` parameter to `create` defaulting to `FirstMatchClaimStrategy.create()`, and forward it from `createSimulation` into `SimulationOptions.create`. `LEVEL_ONE` is left untouched and therefore keeps first-match resolution.
6. In `src/simulation/index.ts`, re-export the claim barrel.
7. Extend `tests/simulation/Simulation.test.ts` with a regression case: build a simulation with a known small grid and roster, run one generation, and assert the resulting grid equals the values the pre-change loop produced — this is the test that would fail if the extraction changed semantics. Add a second case injecting a stub strategy and asserting it is consulted once per contested cell with the expected candidates.
8. Extend `tests/simulation/level/Level.test.ts` with the default and passthrough cases, and add `tests/integration/ClaimStrategyGame.test.ts` running Level 1 under each of the six strategies.
9. Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`, then record the results in the Testing section, replacing the "not run" entries.

**Post-condition**: `Simulation.run` contains no ownership policy. Level 1 plays exactly as before, and passing a different strategy to `Level.create` changes who wins contested cells without touching `Simulation`.

### Phase 4 — Measure the cost of eager candidate evaluation

**Pre-condition**: Phase 3 is complete and the suite is green. `CellClaim.resolve` evaluates every rule of every player for every cell, where the previous loop stopped at the first matching rule of the first matching player.

**Steps**:
1. Add a temporary benchmark that plays `LEVEL_ONE` for 200 generations twice — once through an inline copy of the pre-change loop, once through the new resolver — over the same starting grid and roster, asserting the two produce identical grids so the comparison is like for like.
2. Compare against the worst case, which is bounded and worth stating: on Level 1's 100×100 grid with four players holding three rules each, a fully contested cell costs 12 rule evaluations of 8 neighbour reads, so 960,000 reads per generation versus a previous best case that could stop after one.
3. Mitigate if the regression is material. It was: **2.12×**, or 27.8 ms per generation against 13.7 ms, where the fastest speed level advances one generation per animation frame and so has a 16.6 ms budget. Replacing `rules.filter(...).length` with an index loop, removing a closure and an array allocation per player per cell, changed nothing measurable — the cost is the extra rule evaluations themselves, not allocation.
4. Add `readonly needsAllCandidates: boolean` to `ClaimStrategy` and stop enumeration early in `CellClaim.resolve` when it is `false`. `FirstMatchClaimStrategy` declares `false`; the other five declare `true`, including the decorators, whose own logic compares candidates regardless of what their fallback needs.
5. Delete the benchmark and record the outcome under Additional Notes.

**Post-condition**: The default path costs 1.14× the pre-change loop, inside the frame budget. Strategies that genuinely compare candidates pay the full cost, which is inherent to what they do.

### Phase 5 — Document cell claim resolution

**Pre-condition**: Phase 4 is complete. `README.md` documents levels and rule presets but describes cell ownership nowhere.

**Steps**:
1. In `README.md`, add a "Cell claim" subsection under "Levels" describing the two steps — every player whose rules match becomes a candidate, then the level's claim strategy picks the winner — and stating that the default is first match in roster order, which gives the human player priority.
2. In the same subsection, add a table of the six strategies with a one-line description of the game behaviour each produces, so a reader can choose one for a new level without reading the classes.
3. Add a sentence recording that every strategy is a pure function of the grid, the roster, and the generation number, so the determinism guarantee introduced in #15 continues to hold under all six.

**Post-condition**: `README.md` documents how a cell is claimed, the six available strategies, and their relationship to the determinism guarantee.

## Testing

### TypeScript unit tests

- `tests/simulation/claim/CellClaim.test.ts` *(new, 16 tests)* — candidates are built in roster order with correct `rosterIndex`; `matchedRuleCount` counts every matching rule rather than stopping at the first; a player with no rules, and one whose rules all fail, are absent from the list; `resolve` returns `null` and does not call the strategy when nothing matches or when there are no players; the `ClaimContext` carries the grid, the coordinates, the current owner, the supplied generation, and the roster size; enumeration stops at the first candidate for a strategy declaring `needsAllCandidates: false`, without skipping the non-matching players before it and still counting every rule of the player it stops at; `create` throws `TypeError` for a missing strategy.
- `tests/simulation/claim/FirstMatchClaimStrategy.test.ts` *(new, 5 tests)* — returns the first candidate's id for a single candidate and for several; ignores `matchedRuleCount` and `context.owner`; declares `needsAllCandidates: false`.
- `tests/simulation/claim/IncumbentClaimStrategy.test.ts` *(new)* — the owner keeps the cell when it is a candidate; the fallback decides when the owner is `null`, when the owner is not a candidate, and when the owner is the only candidate anyway; the fallback receives the unfiltered candidate list.
- `tests/simulation/claim/StrongestMatchClaimStrategy.test.ts` *(new)* — the highest `matchedRuleCount` wins outright; a tie delegates to the fallback with only the tied candidates; a single candidate is returned without consulting the fallback.
- `tests/simulation/claim/NeighbourMajorityClaimStrategy.test.ts` *(new)* — the candidate with more owned neighbours wins; counting wraps at all four edges and at a corner; a tie delegates the tied subset; cells owned by non-candidates do not affect the count.
- `tests/simulation/claim/RotatingPriorityClaimStrategy.test.ts` *(new)* — the winner advances by one roster position per generation and wraps at `playerCount`; a candidate absent from the current rotation slot does not block the next candidate in rotation order; the result is stable for a fixed generation.
- `tests/simulation/claim/ContestedCellVoidStrategy.test.ts` *(new)* — two or more candidates yield `null`; a single candidate delegates to the fallback.
- `tests/simulation/Simulation.test.ts` *(updated)* — one generation of a fixed small grid produces the same result as before the extraction; an injected stub strategy is consulted once per contested cell and its return value is written into the next grid; a strategy returning `null` leaves the cell empty.
- `tests/simulation/level/Level.test.ts` *(updated)* — `create` defaults to `FirstMatchClaimStrategy`; a supplied strategy is exposed on the level and reaches the simulation built by `createSimulation`.
- `tests/integration/ClaimStrategyGame.test.ts` *(new, 15 tests)* — Level 1 rebuilt from `LEVEL_ONE`'s own dimensions, pattern, and roster with only the claim strategy varying, played for 10 generations: the implicit default matches an explicit `FirstMatchClaimStrategy` grid for grid; each of the five alternatives produces a grid distinct from first-match; each of the six is reproducible across two identical runs; the void strategy leaves more empty cells than the default; rotation leaves the human player with fewer cells than its permanent first-match priority does; the incumbent strategy still has living cells after 10 generations.
- No GUI tests: nothing in `src/gui/` changes.

- [x] Unit tests added/updated
- [x] Integration tests added/updated — `tests/integration/ClaimStrategyGame.test.ts`
- [x] All tests passing (`npm run test`)

**Test coverage**: New coverage for `CellClaim` and the six strategies, plus the strategy seam in `Simulation` and `Level`. Existing `SumRule`, `GeometryRule`, `WrapCoordinate`, `HiScore`, and level coverage is unaffected — `Rule` and its implementations are untouched. The suite grows from 15 files / 153 tests to 23 files / 234 tests.

**Validation evidence**:

| Command | Result |
|---------|--------|
| `npm run lint` | Passing — no errors or warnings |
| `npm run typecheck` | Passing — no diagnostics |
| `npm run test` | Passing — 23 test files, 234 tests |
| `npm run build` | Passing — `dist/assets/index-ChGmQOqh.js`, 483.10 kB (gzip 121.95 kB) |

### Manual validation steps

| # | Check | Status | How it is verified |
|---|-------|--------|--------------------|
| 1 | Level 1 plays identically to `main` | **Automated** | The Phase 4 benchmark asserted the pre-change loop and the resolver produce identical grids after 200 generations of Level 1, from the same starting grid and roster. Still manual: that the browser renders it unchanged |
| 2 | The default strategy is first match | **Automated** | `Simulation.test.ts` → "awards contested cells to the first player in the roster by default"; `ClaimStrategyGame.test.ts` → "plays level 1 exactly as an explicit first-match strategy does" |
| 3 | A level can select a strategy | **Automated** | `Level.test.ts` → "resolves the simulation's cells through the level's strategy"; `ClaimStrategyGame.test.ts` → the divergence cases for all five alternatives |
| 4 | Determinism still holds | **Automated** | `ClaimStrategyGame.test.ts` → the `determinism` block, reproducing all six strategies across two runs. No strategy calls `Math.random()` |
| 5 | No frame-rate regression | **Measured** | Phase 4 benchmark: 1.14× the pre-change loop on the default path, 15.7 ms per generation against the 16.6 ms frame budget. Still manual: watching a long run at maximum speed in the browser |
| 6 | The canvas still renders a running game | Manual | `npm run dev`, start a game, and confirm the grid animates as before |

## Documentation Plan

| File | Changes |
|------|---------|
| `README.md` | Adds a "Cell claim" subsection under "Levels": the candidate-then-winner resolution, a table of the six strategies and the game behaviour each produces, and a note that all six preserve the determinism guarantee |
| JSDoc in `src/simulation/claim/ClaimStrategy.ts` | Documents the contract: non-empty candidates ordered by roster index, a return that must be a candidate id or `null`, and what `needsAllCandidates` means for a decorator |
| JSDoc in `src/simulation/claim/CellClaim.ts` | Documents the two-step resolution and carries over the existing explanation of why a player's rules are OR-combined rather than AND-combined |
| JSDoc in `src/simulation/claim/ClaimCandidate.ts` | Documents why `matchedRuleCount` is a count rather than a boolean, and what `rosterIndex` is for |
| JSDoc in each strategy class | Documents the selection rule, the fallback's role, and the game behaviour the strategy produces |
| JSDoc in `src/simulation/Simulation.ts` | `run` states that resolution is delegated to the configured strategy; the OR explanation is removed in favour of the copy on `CellClaim` |
| JSDoc in `src/simulation/level/Level.ts` | Documents the new `claimStrategy` parameter and its default |

## Related Issues
Closes #16
Related to #15

## Checklist
- [x] Code follows project conventions (static factory methods, private constructors, one type per file, interface-based extension)
- [x] TypeScript types are correct (`npm run typecheck` passes)
- [x] Code lints without errors (`npm run lint` passes)
- [x] All tests pass (`npm run test` passes)
- [x] Build succeeds (`npm run build` passes)
- [x] JSDoc comments added for public APIs
- [x] Updated documentation (if applicable) — `README.md` "Cell claim" section
- [x] No breaking changes — both new parameters are optional and trailing, and the default reproduces current behaviour
- [ ] Commit messages follow Conventional Commits format — nothing committed yet

## Additional Notes

**The six strategies at a glance.** Each is a complete answer to "who claims this cell", and the four marked as composing take another `ClaimStrategy` to settle what they leave undecided.

| Strategy | Winner | Composes | Effect on play |
|----------|--------|----------|----------------|
| `FirstMatchClaimStrategy` | Lowest roster index | — | Today's behaviour. The human player, always first in the roster, wins every contest |
| `IncumbentClaimStrategy` | The current occupant, if still matching | Yes | Territory becomes defensible; a player is displaced only when its own rules stop matching |
| `StrongestMatchClaimStrategy` | Most matching rules | Yes | Rewards rule sets that fit the local neighbourhood over roster position |
| `NeighbourMajorityClaimStrategy` | Most owned neighbours | Yes | Ownership follows local support; growth spreads from established territory rather than from priority |
| `RotatingPriorityClaimStrategy` | Roster index rotated by generation | No — total order | Distributes the first-match advantage evenly across the roster over a run. Measurably costs the human player cells on Level 1 |
| `ContestedCellVoidStrategy` | Nobody, when contested | Yes | Boundaries erode into empty front lines instead of one player absorbing another |

Composition is the point of the delegate parameter: `IncumbentClaimStrategy.create(StrongestMatchClaimStrategy.create(FirstMatchClaimStrategy.create()))` reads as "the occupant defends; otherwise the strongest match takes it; otherwise roster order decides", and needs no new class.

**Two strategies deliberately not implemented.** A weighted-random strategy — picking among candidates in proportion to `matchedRuleCount` — is the obvious fifth option and is rejected because it would break the determinism guarantee established in #15, under which a level run is reproducible generation for generation given a fixed human selection. If randomness is ever wanted, it needs a seeded generator injected through the level, which is its own issue. A score-aware strategy favouring the player with fewer cells overall (a rubber-band handicap) is deferred because it needs the whole-grid cell counts, which `ClaimContext` deliberately does not carry: adding them would make every strategy depend on state that changes only once per generation, and the right shape for that is a per-generation preamble on the strategy interface rather than a fatter context.

**Phase 4 outcome, and the one design change it forced.** The plan accepted an eager candidate list on the argument that five of the six strategies need it anyway. The measurement did not support that for the default path: building the full list cost **2.12×** the pre-change loop over 200 generations of Level 1 — 27.8 ms per generation against 13.7 ms — and the fastest speed level advances one generation per animation frame, a 16.6 ms budget. The default configuration would have missed it, halving the frame rate of every existing game.

Removing the per-cell closure and array that `rules.filter(...).length` allocates changed nothing measurable, which located the cost in the extra rule evaluations themselves: first-match resolution stops after the first matching rule of the first matching player, roughly one to two evaluations, where eager enumeration always performs eleven.

The mitigation is not the lazy enumeration the plan proposed. Yielding candidates one at a time would have turned `ClaimStrategy` into an iteration protocol, and `candidates.length`, `.filter`, and `.some` are what make the other five strategies read as decisions. Instead `ClaimStrategy` gained `readonly needsAllCandidates: boolean`, and `CellClaim.resolve` stops at the first candidate when it is `false`. Only `FirstMatchClaimStrategy` declares `false`. This keeps `selectWinner` exactly as specified, states the requirement as a property of each strategy rather than a special case inside the resolver, and needs no `instanceof` check — the coupling Phase 4 step 3 warned against. The default path now costs **1.14×** the pre-change loop, 15.7 ms per generation, inside the budget. The residual 14% is the rules of the winning player that are still evaluated to compute `matchedRuleCount` after the first one matches.

The five comparing strategies still pay the full eager cost, at roughly 28 ms per generation on a 100×100 grid. That is inherent — a strategy that ranks candidates cannot rank ones it has not evaluated — but it means a level choosing one of them is choosing a slower simulation, and should be paired with a smaller grid or a slower default speed if that matters.

**Roster order stays load-bearing.** Even under the new strategies, `Level.createPlayers` returning `[human, ...computers]` still decides the default tiebreak, because `FirstMatchClaimStrategy` is the terminal fallback in every composition. This PR makes that dependency explicit and overridable; it does not remove it. Whether a level *should* give the human first-match priority is a game-balance question this PR deliberately leaves open, now that answering it differently costs one constructor argument.

**Interaction with `Rule`.** Nothing in `src/simulation/rule/` changes. A rule still answers "does this player match here" for one player at a time, and knows nothing about contests; the claim layer sits strictly above it. That separation is what keeps `matchedRuleCount` meaningful — it counts independent rule matches, so a player who selected three overlapping presets genuinely does match more strongly than one who selected a single narrow rule.
