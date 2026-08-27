# feat(simulation): claim unclaimed cells through territorial expansion

## Summary

Adds an `UnclaimedCellStrategy` seam so cells no player's rules match can still be claimed by
territorial expansion, with two deterministic implementations: threshold conversion and neighbour
dominance. Also fixes `GlobalSimulationMode` to persist a cell's claim when its value lapses, which
the feature depends on and which the `Cell` contract already requires.

## Motivation

In global simulation a cell's owner is re-derived from scratch every generation. `GlobalSimulationMode`
writes `{ ownerId: result, value: result }`, so the moment a player's rules stop matching a cell it
owns, that cell loses **both** its value and its claim. This contradicts `Cell`, which documents
`ownerId` as "the persistent claim … only a cell whose owner lets its value lapse keeps them apart",
and it diverges from `PlayerLocalSimulationMode`, which persists claims correctly. Global mode
therefore has no persistent territory at all.

On top of that, neutral ground can only ever change hands as a side effect of a birth rule firing.
`CellClaim.resolve` returns `null` early when no player's rules match a cell, so a cell surrounded by
one player's territory stays neutral indefinitely unless that player's rule set happens to match it.
There is no way for territory to expand into neutral space through ownership pressure, which is the
mechanic that makes a multi-player grid feel like a contest over land rather than four independent
automata sharing a canvas.

### A note on the originating request

The request described global mode as "only updating claimed cells". That is not accurate for global
mode — it sweeps every cell of the grid, unclaimed included. That description matches
`PlayerLocalSimulationMode`, which the README states plainly: *"A player cannot birth a cell into
unclaimed empty space except by standing on it."* The real defect in global mode is the inverse:
claims are not persistent. This PR addresses the underlying goal — letting neutral ground be taken —
and fixes the persistence defect it rests on.

## Changes

### Files Deleted

- None

### Files Updated

- **`src/simulation/claim/UnclaimedCellStrategy.ts`** *(new)* — Interface with `selectOwner(context: UnclaimedCellContext): number | null`, mirroring `ClaimStrategy`'s shape.
- **`src/simulation/claim/UnclaimedCellContext.ts`** *(new)* — Context carrying `grid`, `x`, `y`, `players` and `generation` for a cell no rule matched.
- **`src/simulation/claim/NoUnclaimedConversionStrategy.ts`** *(new)* — Null object returning `null` always; the default, preserving current behaviour exactly.
- **`src/simulation/claim/ThresholdConversionStrategy.ts`** *(new)* — Converts when a single player owns at least `N` of the 8 neighbours, reading `ownerId`. `N` is constructor-injected, defaulting to 3.
- **`src/simulation/claim/NeighbourDominanceStrategy.ts`** *(new)* — Converts to the player holding the most *living* neighbours, reading `value`, so dormant territory exerts no pull.
- **`src/simulation/claim/CellClaim.ts`** — Accepts an `UnclaimedCellStrategy` in `create`; the zero-candidate branch consults it instead of returning `null` unconditionally.
- **`src/simulation/claim/index.ts`** — Exports the new interface, context and three strategies.
- **`src/simulation/mode/GlobalSimulationMode.ts`** — Carries `ownerId` forward from the read grid when the resolved value is `null`, so a claim survives a dormant generation.
- **`src/simulation/SimulationOptions.ts`** — New optional `unclaimedCellStrategy` field defaulting to `NoUnclaimedConversionStrategy`.
- **`src/simulation/Simulation.ts`** — Passes the strategy through to `CellClaim.create`.
- **`src/simulation/level/Level.ts`** — New optional constructor argument and readonly field for the conversion strategy.
- **`src/simulation/level/CustomLevel.ts`** — `createCustomLevel` takes a third argument and forwards it.
- **`src/gui/AvailableUnclaimedStrategies.ts`** *(new)* — Catalogue of the three selectable options with display names and descriptions.
- **`src/gui/screens/GameConfigurationScreen.ts`** — Adds an "Expansion" picker to the Custom-level section and threads the selection into `createCustomLevel`.
- **`src/gui/index.ts`** — Exports the new catalogue.
- **`README.md`** — Documents persistent claims in global mode and a new "Unclaimed cell conversion" subsection.

## Type of Change

- [x] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [x] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Test coverage improvement

Note: the persistence fix changes observable global-mode behaviour. It is classed as a bug fix
because it brings the mode into line with the documented `Cell` contract, but it does alter how
existing levels evolve. See Additional Notes.

## Implementation Plan

### Phase 1 — Make claims persistent in global simulation

**Pre-condition**: `GlobalSimulationMode.nextGeneration` writes `ownerId` and `value` from the same
`resolve` result, discarding any prior claim.

**Steps**:

1. In `src/simulation/mode/GlobalSimulationMode.ts`, capture `context.grid[y][x].ownerId` as
   `priorOwner` before resolving, because the read grid is the only place the previous claim exists.
2. Replace the write at line 52 with `{ ownerId: result ?? priorOwner, value: result }`, so a cell
   that resolves to `null` keeps its owner and goes dormant rather than being wiped.
3. Update the class docblock to state that claims persist and that a dormant cell is re-evaluated
   every generation, matching the wording already used in `PlayerLocalSimulationMode`.
4. Re-baseline `tests/simulation/mode/GlobalSimulationMode.test.ts` with a case asserting that a cell
   whose rules stop matching retains `ownerId` and reports `value === null`.

**Post-condition**: A claim in global mode survives generations where its owner's rules do not match,
and `Cell`'s documented contract holds in both simulation modes.

**Dependencies**: None.

### Phase 2 — Introduce the UnclaimedCellStrategy seam

**Pre-condition**: Phase 1 complete, so "unclaimed" reliably means "never claimed by any player".

**Steps**:

1. Add `src/simulation/claim/UnclaimedCellContext.ts` with readonly `grid`, `x`, `y`, `players` and
   `generation`. `players` is included because conversion iterates the roster rather than receiving a
   pre-built candidate list.
2. Add `src/simulation/claim/UnclaimedCellStrategy.ts` declaring
   `selectOwner(context: UnclaimedCellContext): number | null`, documenting that returning a player id
   claims the cell as dormant territory.
3. Add `src/simulation/claim/NoUnclaimedConversionStrategy.ts` as a null object returning `null`, with
   a private constructor and static `create`, so the default path is a real object rather than a null check.
4. Change `CellClaim.create` in `src/simulation/claim/CellClaim.ts` to take the conversion strategy as
   a second parameter, throwing `TypeError` when absent, consistent with the existing strategy guard.
5. Replace the `candidates.length === 0` early return with a call to
   `this.unclaimedStrategy.selectOwner({ ... })`, so a zero-candidate cell is now a decision rather
   than an assumption.
6. Export all three new files from `src/simulation/claim/index.ts`.

**Post-condition**: The seam exists and is exercised by the null object; behaviour is byte-identical
to before Phase 2.

**Dependencies**: Phase 1.

### Phase 3 — Implement the two conversion strategies

**Pre-condition**: Phase 2 complete; `UnclaimedCellStrategy` is stable.

**Steps**:

1. Add `src/simulation/claim/ThresholdConversionStrategy.ts` with `create(threshold: number, fallback: ClaimStrategy)`.
   It tallies each player's owned neighbours over the 8 wrapped Moore offsets reading `ownerId`, keeps
   the players meeting `threshold`, and returns the sole leader.
2. Add `src/simulation/claim/NeighbourDominanceStrategy.ts` with `create(fallback: ClaimStrategy)`.
   It tallies neighbours reading `value` rather than `ownerId`, so only living cells exert pressure,
   and returns the player with the strict maximum.
3. In both, when two or more players tie, build `ClaimCandidate` entries for the tied players carrying
   the neighbour count in `matchedRuleCount` and delegate to `fallback.selectWinner`, mirroring the tie
   handling in `NeighbourMajorityClaimStrategy`. Document on both classes that `matchedRuleCount`
   carries a neighbour count on this path, since no rule matched.
4. Reuse the wrapped-neighbour traversal by importing `wrapCoordinate` from `../WrapCoordinate`, as the
   existing rules and `NeighbourMajorityClaimStrategy` do, rather than duplicating edge handling.
5. Return only the owner id; `CellClaim` continues to return the value separately, so the mode is what
   writes a dormant cell. See Phase 4.

**Post-condition**: Two conversion strategies exist, are unit tested in isolation, and are unreachable
from a running game until Phase 5.

**Dependencies**: Phase 2.

### Phase 4 — Write converted cells as dormant territory

**Pre-condition**: Phase 3 complete.

**Steps**:

1. Change `CellClaim.resolve`'s return type to a small result carrying `ownerId` and `value`
   separately, because a converted cell needs `ownerId` set with `value` left `null` — a single
   `number | null` cannot express that.
2. Update `GlobalSimulationMode` to write the returned pair directly, preserving the Phase 1 fallback
   to the prior owner.
3. Update `PlayerLocalSimulationMode` to read `.value` from the result where it currently uses the
   bare return, leaving its own `ownerId: player.id` assignment untouched.
4. Confirm no scoring change is needed: `Simulation.getCellCounts` already skips `value === null`, so
   dormant conversions correctly score zero.

**Post-condition**: Converting a neutral cell yields owned, valueless territory that revives on its own
if the owner's rules later match it.

**Dependencies**: Phase 3.

### Phase 5 — Expose the strategy through levels and the configuration screen

**Pre-condition**: Phase 4 complete; conversion works when wired in code.

**Steps**:

1. Add an optional `unclaimedCellStrategy` to `SimulationOptions.create`, defaulting to
   `NoUnclaimedConversionStrategy.create()`, and pass it into `CellClaim.create` from `Simulation`.
2. Add the matching optional argument and readonly field to `Level`, defaulting the same way, so the
   three fixed levels are unchanged.
3. Extend `createCustomLevel` in `src/simulation/level/CustomLevel.ts` with a third parameter and
   forward it to `Level.create`.
4. Add `src/gui/AvailableUnclaimedStrategies.ts` exporting `AVAILABLE_UNCLAIMED_STRATEGIES` with three
   entries — None, Threshold, Neighbour dominance — each composing `FirstMatchClaimStrategy.create()`
   as its fallback, matching the convention in `AvailableClaimStrategies.ts`.
5. In `src/gui/screens/GameConfigurationScreen.ts`, add `selectedUnclaimedStrategyIndex`, reset it to 0
   alongside `selectedClaimStrategyIndex`, add a third `buildOptionSelect('Expansion:', …)` to the
   Custom-level picker group, and pass the selection as the new third argument to `createCustomLevel`.

**Post-condition**: A player can select an expansion rule for a custom level, and every fixed level
behaves exactly as before.

**Dependencies**: Phase 4.

## Testing

### TypeScript unit tests

New test files:

- `tests/simulation/claim/ThresholdConversionStrategy.test.ts` — below threshold leaves the cell null; at threshold converts; two players at threshold delegate to the fallback; neighbour counting wraps at the grid edge; dormant neighbours count because `ownerId` is read.
- `tests/simulation/claim/NeighbourDominanceStrategy.test.ts` — strict majority converts; a tie delegates to the fallback; dormant neighbours do **not** count because `value` is read; a cell with no living neighbours stays null.
- `tests/simulation/claim/NoUnclaimedConversionStrategy.test.ts` — always returns null regardless of neighbourhood.

Updated test files:

- `tests/simulation/claim/CellClaim.test.ts` — zero-candidate cells now consult the conversion strategy; the strategy is not consulted when at least one player matched.
- `tests/simulation/mode/GlobalSimulationMode.test.ts` — claims persist through a dormant generation; a converted cell is written as owned with a null value.
- `tests/simulation/mode/PlayerLocalSimulationMode.test.ts` — unchanged behaviour under the new result shape.
- `tests/simulation/level/CustomLevel.test.ts` — the third argument reaches the created level.
- `tests/integration/ClaimStrategyGame.test.ts`, `tests/integration/LevelOneGame.test.ts` — re-baselined for persistent claims in global mode.

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests passing (`npm run test`)

**Test coverage**: Both conversion strategies are covered on success and failure paths, including the
tie-delegation path and toroidal wrapping. The persistence fix is covered by a dedicated dormancy case.

**Status**: **Not run — no implementation exists yet.** This document is the plan produced before any
code was written. Every checklist box above is intentionally unchecked and must be ticked only once
the commands below have actually been executed against the implementation.

### Manual validation steps

| # | Check | How to verify |
|---|-------|---------------|
| 1 | Fixed levels are unchanged | Start Level 1 in global mode, note the generation the grid dies; compare against `main`. Must be identical. |
| 2 | Claims persist through dormancy | Run global mode and confirm cells fade to the 25% dormant tint instead of vanishing, then revive. |
| 3 | Threshold conversion expands territory | Custom level, Expansion = Threshold. Confirm neutral pockets inside a player's territory fill in over successive generations. |
| 4 | Dominance follows living cells | Custom level, Expansion = Neighbour dominance. Confirm expansion tracks the live frontier and stalls where a player has only dormant cells. |
| 5 | Conversion does not inflate score | Confirm the scoreboard does not rise on a generation where only conversions occurred. |
| 6 | Expansion picker only shows for Custom | Select Levels 1–3 and confirm the Expansion picker stays hidden. |
| 7 | Frame budget holds | Run a 100x100 custom level at the fastest speed with Threshold selected; confirm no visible stutter. |

## Documentation Plan

| File | Changes |
|------|---------|
| `README.md` | Correct the global-mode description to state that claims persist and cells go dormant rather than being wiped. Add an "Unclaimed cell conversion" subsection under "Cell claim" with a table of the three options and their effect on play. Note that both conversion strategies are pure functions of the grid, so the determinism guarantee is unaffected. Document that a converted cell arrives dormant and scores nothing until it revives. |

## Related Issues

Closes #25

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

No box is ticked: no implementation has been written, so no command has been run. Validation evidence
for `npm run lint`, `npm run test`, `npm run build` and `npm run typecheck` must be gathered and pasted
here before this PR is opened.

## Additional Notes

### Deliberately out of scope

The originating request listed nine mechanisms across four categories. Only the two that are pure
functions of the current grid ship here. The other seven were deferred because each requires state the
cell model does not have:

| Mechanism | Blocker | Follow-up |
|---|---|---|
| Infection / Contagion | Needs the previous generation's grid on the context to detect a 0-to-1 transition | Separate issue |
| Cellular Overflow | Needs 64 neighbourhood reads per unclaimed cell; performance must be measured first | Separate issue |
| Cultural Pressure Drift | Needs a per-cell persistent counter; `Cell` has no history | Separate issue |
| Placement / Seeds | Player-driven input, contradicting global mode's "positions are ignored" contract | Belongs to player-local mode |
| Colonizers | Needs a per-cell flag and direction | Belongs to player-local mode |
| Wildfire / Decay | An active *neutral* cell is unrepresentable: `value` **is** a player id, as `getCellCounts` relies on | Needs a cell-model change |
| Claim Mutagens / Spores | Requires randomness, voiding the README's "no randomness is consulted" guarantee | Needs a determinism decision first |

### Behaviour change reviewers should scrutinise

Phase 1 alters how every existing global-mode level evolves: cells that previously vanished now
persist as dormant territory and count as territorial support for `NeighbourMajorityClaimStrategy`,
which reads `ownerId`. Two integration test baselines change as a direct result. If reviewers would
rather keep that isolated, Phase 1 can be split into its own PR ahead of this one.

### Known wart

On the conversion path `ClaimCandidate.matchedRuleCount` carries a neighbour count rather than a rule
count, because no rule matched. This lets the conversion strategies reuse the six existing tie-break
strategies instead of duplicating them, but it means `StrongestMatchClaimStrategy` compares neighbour
counts on neutral cells. The alternative — a parallel `ConversionCandidate` hierarchy — was judged not
worth doubling the strategy surface. Both classes carry a docblock stating this.
