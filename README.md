# automata

Experiment to test some cellular automata.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- npm

## Installation

```bash
npm install
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR at `http://localhost:5173` |
| `npm run build` | Bundle for browser to `dist/` via Vite |
| `npm run preview` | Serve the Vite production build locally |
| `npm start` | Compile and run headlessly in Node.js |
| `npm run build:node` | Compile TypeScript to `dist/` via tsc |
| `npm run test` | Run Vitest tests once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run typecheck` | Type-check without emitting files |
| `npm run lint` | Check for lint errors |
| `npm run lint:fix` | Auto-fix lint errors |

### `npm start`

Compiles the project via `tsc` and executes `dist/main.js` in Node.js:

```bash
npm start
```

The browser GUI (`SimulationRenderer`) is automatically skipped in Node.js — only the simulation runs headlessly.

## Browser GUI

The project includes a Three.js browser renderer under `src/gui/`.

### Development server

Start the Vite dev server for live development with Hot Module Replacement:

```bash
npm run dev
```

Open `http://localhost:5173` in a browser. The simulation renders in real time and the page reloads on any source change.

### Production build

Bundle for production and preview locally:

```bash
npm run build
npm run preview
```

`vite build` outputs to `dist/`. `vite preview` serves that output at `http://localhost:4173`.

### Computing a generation

`ConfigurableSimulationMode.nextGeneration` is the one generation loop every mode — both
presets and any custom pairing — runs. It allocates a fresh, all-empty grid, then applies
three strategies in order for every cell it visits:

| Step | Strategy applied | What it decides |
|------|-------------------|------------------|
| 1. Choose the cells | `IterationStrategy.cellsToVisit` | Which `(x, y)` cells this generation evaluates at all. A cell never visited is left empty, whatever it held before. |
| 2. Build candidates | `RuleSetApplicationStrategy.buildCandidates` | Of the roster, which players are even eligible for this cell, and — for each eligible player — whether its rules match and how strongly. Enumeration may stop early once the claim-resolution strategy has enough candidates to decide. |
| 3. Pick a winner | `CellClaimResolutionStrategy.selectWinner` | Which candidate, if any, claims the cell's *value* this generation. Skipped entirely when step 2 found no candidates — an unmatched cell is never a decision the claim strategy gets to make. |
| 4. Fall back to an owner | `RuleSetApplicationStrategy.resolveOwner` | Only consulted when step 3 left the cell's value null. Decides the cell's persistent *owner* independently of its value, so a mode with territorial memory (player local) can keep a claim through a generation where the owner's rules stopped matching — a *dormant* cell — while a mode with no such memory (global) reports no owner and the cell reverts to fully unclaimed. |

#### Assigning a cell's owner and value

The cell is then written as `{ ownerId, value }`. `value` is step 3's result — a candidate's
id, or null when step 3 was skipped (no candidates) or declined the cell. `ownerId` is that
same result when a candidate won it; otherwise it falls back to step 4's result instead.

Owner and value therefore only diverge — decided by two different strategies — on a cell no
candidate won. That is precisely what lets ownership persist independently of whether this
generation's rules matched: the mechanism behind player local simulation's dormant cells (see
"Game modes" below).

Applied to the two presets:

- **Global simulation** visits every cell (step 1), offers every roster player as a candidate
  (step 2), and never falls back to an owner (step 4 always reports null) — so a cell no
  player's rules currently match is unowned outright, with no memory of who held it before.
- **Player local simulation** visits only owned or occupied cells (step 1), restricts step 2
  to the cell's current owner or occupant, and falls back to that same player as the owner
  (step 4) whenever their rules do not match this generation — turning what would otherwise be
  an empty cell into a dormant one instead.

### Available strategy implementations

Each of the three strategy interfaces from the steps above has more than one implementation
to choose from.

#### Iteration strategy

Decides which cells a generation evaluates at all — step 1 of "Computing a generation" above.

| Implementation | Visits |
|----------------|--------|
| `SweepAllCellsIterationStrategy` | Every cell of the grid. Used by global simulation. |
| `PlayerLocalIterationStrategy` | Every cell a player owns, plus every player's current position, de-duplicated. Used by player local simulation. |

#### Rule-set application strategy

Decides which players are eligible for a visited cell and builds candidates from their
matching rules, and which owner to fall back to when no candidate wins — steps 2 and 4 of
"Computing a generation" above.

| Implementation | Eligibility (step 2) | Owner fallback (step 4) |
|-----------------|------------------------|---------------------------|
| `GlobalRuleSetApplicationStrategy` | Every roster player | Always null — a cell no player matches is fully unowned. Used by global simulation. |
| `PlayerLocalRuleSetApplicationStrategy` | Only the cell's current owner, or its occupant when unowned | The same eligible player, even when its rules do not match — a dormant claim. Used by player local simulation. |

#### Claim-resolution strategy

Decides which candidate wins a cell more than one player matched — step 3 of "Computing a
generation" above.

| Implementation | Winner |
|----------------|--------|
| `FirstMatchClaimStrategy` | Lowest roster index. The default. |
| `IncumbentClaimStrategy` | The current occupant, if it is still among the candidates |
| `StrongestMatchClaimStrategy` | The candidate with the most matching rules |
| `NeighbourMajorityClaimStrategy` | The candidate owning the most neighbouring cells |
| `RotatingPriorityClaimStrategy` | The candidate closest to a roster priority that rotates each generation |
| `ContestedCellVoidStrategy` | Nobody — a cell more than one candidate matched is emptied instead of awarded |

See "Cell claim" below for how these compose (most take a fallback strategy for the ties they
leave undecided) and their fuller effect on play.

### Game modes

A game is played in one of three modes: two chosen at the top of the game-configuration
screen, and a third assembled in code from the strategies above. The mode decides *which*
cells a generation evaluates; the claim strategy below decides *who* owns each of them.

| Mode | What a generation evaluates |
|------|-----------------------------|
| **Global simulation** | Every cell of the grid, against every player's rules. The default, and the only mode the game had before this option existed |
| **Player local simulation** | For each player, only the cells that player owns plus the single cell it stands on, against that player's own rules |
| **Custom simulation** | Whatever `IterationStrategy` and `RuleSetApplicationStrategy` pairing is selected, either on the game-configuration screen or assembled in code |

#### Global simulation

| Strategy | Implementation |
|----------|-----------------|
| `IterationStrategy` | `SweepAllCellsIterationStrategy` |
| `RuleSetApplicationStrategy` | `GlobalRuleSetApplicationStrategy` |
| `CellClaimResolutionStrategy` | Configurable independently of the mode — defaults to `FirstMatchClaimStrategy` (see "Cell claim" below) |

The default mode, and the only one the game had before player local simulation was added.
Every cell is always a candidate for every player, so the claim-resolution strategy (see
"Cell claim" below) is fully in effect on every cell, every generation. A cell no player's
rules currently match is unowned outright — there is no memory of who held it before.

#### Player local simulation

| Strategy | Implementation |
|----------|-----------------|
| `IterationStrategy` | `PlayerLocalIterationStrategy` |
| `RuleSetApplicationStrategy` | `PlayerLocalRuleSetApplicationStrategy` |
| `CellClaimResolutionStrategy` | Configurable independently of the mode, though it has no effect here (see below) |

Player local simulation gives every player a position on the grid. Two consequences follow
from the evaluation scope:

- **Territory can never be taken.** No cell is ever a candidate for two players, so a cell
  never changes from one owner to another. The claim strategy is still consulted but
  is only ever offered one candidate, so **the claim-strategy choice has no effect in this
  mode**.
- **Territory dims rather than dying.** A claimed cell keeps its owner even through
  generations where the owner's rules stop matching it. Such a cell is *dormant*: it is
  drawn in its owner's colour toned down to 25%, it does not count toward the player's
  score, and it does not count as a live neighbour for other cells' rules — but it stays
  in the player's evaluated set, so it comes back to full colour on its own as soon as its
  neighbourhood matches the owner's rules again. A player therefore never has to walk back
  over lost ground to reclaim it.
- **Growth still needs a foothold.** A player cannot birth a cell into unclaimed empty
  space except by standing on it. Computer players do not move, so their live territory
  still shrinks while the human can hold ground.

Selecting player local simulation reveals a **Player positioning** picker, which decides
where each player starts:

| Strategy | Start cell |
|----------|-----------|
| `FirstClaimedCellPositioning` | The first cell the player owns, scanning the grid top-left to bottom-right |
| `RandomClaimedCellPositioning` | A cell drawn uniformly from the ones the player owns, so two games open differently |

Both read the grid after the starting pattern has been applied, so a player always begins
inside its own territory. `RandomClaimedCellPositioning` consults `Math.random()` once per
player at game start, which is the one exception to the determinism guarantee below.

#### Custom simulation

Unlike the two presets above, custom simulation has no fixed strategy configuration: it is
`ConfigurableSimulationMode` constructed directly from whatever `IterationStrategy` and
`RuleSetApplicationStrategy` a caller supplies — any of the built-in implementations listed
in "Available strategy implementations" above, or new ones written to fit. The
claim-resolution strategy is configured the same way as for the two presets, independently
of this choice.

`GlobalSimulationMode.create()` and `PlayerLocalSimulationMode.create()` are just:

```ts
ConfigurableSimulationMode.create(
  SweepAllCellsIterationStrategy.create(),
  GlobalRuleSetApplicationStrategy.create(),
);
```

and the player-local equivalent with its own pair. A custom mode is any other pairing,
constructed the same way and passed as the `mode` argument to `SimulationOptions.create` or
`Level.createSimulation`:

```ts
const customMode = ConfigurableSimulationMode.create(
  myIterationStrategy,
  myRuleSetApplicationStrategy,
);
```

Choosing "Custom" in the **Game mode** selector reveals an **Iteration strategy** picker and
a **Rule-set application** picker (see "Choosing a level" below for their tables); the
selected pair is assembled into a `ConfigurableSimulationMode` when the game starts. The
code-level `ConfigurableSimulationMode.create(...)` route above remains available for
strategies not in either catalogue.

### In-game controls

In player local simulation, the human player walks its position with the keyboard:

| Key | Move |
|-----|------|
| `W` | Up one cell |
| `X` | Down one cell |
| `A` | Left one cell |
| `D` | Right one cell |

A move applies immediately rather than at the next generation boundary. A cell owned by
another player is refused and the position does not change; empty cells and the player's
own cells are always legal. Movement wraps at the grid edges, exactly as the toroidal
neighbourhood the rules use does — stepping off the left edge arrives at the right edge of
the same row. Each occupied cell is drawn pulsing between its player's colour and white,
at a rate independent of the simulation speed.

While a game is running, two overlays sit on top of the simulation canvas:

- **Scoreboard** (top centre) — one row per participant showing a colour swatch and that
  participant's current number of living cells: the human player plus the three computer
  players defined by the level.
- **Control bar** (bottom centre) — "Slow down" and "Speed up" step through five speed
  levels and the readout shows the current one. Level 5 advances one generation per
  animation frame, the fastest rate the renderer supports; each slower level holds a
  generation for twice as many frames. "Exit" abandons the game and returns to the title
  screen without asking the simulation to record a score.

### Levels

A level defines how a game begins. It fixes four things:

- the grid dimensions,
- the **starting pattern** — the state of every cell at generation 0,
- the participants, and
- the three rules each computer player starts with.

It deliberately does not fix the human player's rules. Those stay with the player, chosen
on the game-configuration screen and handed to the level when the game starts. A level
therefore carries the human as a `HumanPlayerSlot` — an id and a name, no rules — while
each computer player is a full `Player`.

| Method | Description |
|--------|-------------|
| `level.createPlayers(humanRules)` | Assemble the roster, human first, with the supplied rules |
| `level.createSimulation(humanRules, hiScore?)` | Build a `Simulation` at generation 0 with the starting pattern applied |

#### Level 1

A 100×100 grid opening on a checker of 10×10-cell blocks. The block at
(`blockX`, `blockY`) takes entry `(blockX + blockY) % 5` of the sequence
`[1, 2, 3, 4, null]`, so the cycle advances along both axes. The top-left corner, one
character per block (`.` is empty):

```
1 2 3 4 . 1 2 3 4 .
2 3 4 . 1 2 3 4 . 1
3 4 . 1 2 3 4 . 1 2
4 . 1 2 3 4 . 1 2 3
. 1 2 3 4 . 1 2 3 4
```

The five-entry cycle divides the ten blocks per row exactly. That matters because the grid
is toroidal: a cycle length that did not divide ten would put two same-coloured blocks
side by side at the wrap boundary. Each participant opens with 20 blocks — 2,000 cells —
and 2,000 cells start empty.

| id | Name | Colour | Rules |
|----|------|--------|-------|
| 1 | `Player 1` | red | Chosen on the configuration screen |
| 2 | `Computer 1` | blue | Born at 3, Survive 2–3, Survive 3–4 |
| 3 | `Computer 2` | green | Born at 1, Survive at 1, Born at 2–3 |
| 4 | `Computer 3` | yellow | Born at 1–2, Survive 4–5, Survive 2–3 |

#### Level 2

A 100×100 grid opening on four 20×20 blocks, one per participant, each centred in its own
grid quadrant. Because the grid is toroidal, the gap between every pair of blocks — including
across the wrap boundary — is exactly 30 cells, in both directions. One character per 5 cells:

```
. . . . . . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . . . . . .
. . . 1 1 1 1 . . . . . . 2 2 2 2 . . .
. . . 1 1 1 1 . . . . . . 2 2 2 2 . . .
. . . 1 1 1 1 . . . . . . 2 2 2 2 . . .
. . . 1 1 1 1 . . . . . . 2 2 2 2 . . .
. . . . . . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . . . . . .
. . . 3 3 3 3 . . . . . . 4 4 4 4 . . .
. . . 3 3 3 3 . . . . . . 4 4 4 4 . . .
. . . 3 3 3 3 . . . . . . 4 4 4 4 . . .
. . . 3 3 3 3 . . . . . . 4 4 4 4 . . .
. . . . . . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . . . . . .
```

Each participant opens with 400 cells; the remaining 6,400 cells start empty.

#### Level 3

A 100×100 grid opening on the same four 20×20 blocks as Level 2, but tiled together at the
centre of the grid instead of spread across its quadrants, so every participant starts
adjacent to every other one. The cropped view below shows the 40×40 central square where
all the action is — everything outside it is empty, one character per 5 cells:

```
1 1 1 1 2 2 2 2
1 1 1 1 2 2 2 2
1 1 1 1 2 2 2 2
1 1 1 1 2 2 2 2
3 3 3 3 4 4 4 4
3 3 3 3 4 4 4 4
3 3 3 3 4 4 4 4
3 3 3 3 4 4 4 4
```

Each participant opens with 400 cells, the same as Level 2 — only their placement differs.

#### Choosing a level

The game-configuration screen opens with a **Game mode** selector (see "Game modes" above)
followed by a level selector offering Level 1, Level 2, Level
3, and a **Custom** option. Choosing "Custom" reveals two more pickers: a **starting
pattern** (the checker from Level 1, or either rectangle layout from Level 2 and Level 3)
and a **claim strategy** (any of the six strategies below). A custom level keeps Level 1's
grid size and roster — only the pattern and the strategy vary — so it always starts four
participants of 100×100-cell games apart in whatever shape and contest rule the player picks.

Choosing "Custom" in the **Game mode** selector instead reveals an **Iteration strategy**
picker and a **Rule-set application** picker:

| Strategy | Cells visited |
|----------|----------------|
| `SweepAllCellsIterationStrategy` | Every cell of the grid. Matches the default mode |
| `PlayerLocalIterationStrategy` | Only the cells a player owns plus the cell it stands on. Needs start positions |

| Strategy | Who is eligible for a visited cell |
|----------|-------------------------------------|
| `GlobalRuleSetApplicationStrategy` | Every player. Matches the default mode |
| `PlayerLocalRuleSetApplicationStrategy` | Only the cell's current owner or the player standing on it |

Choosing an iteration strategy that needs positions reveals the **Player positioning**
picker described above, exactly as selecting player local simulation does.

#### Cell claim

A cell's owner in the next generation is decided in two steps.

1. **Candidates.** Every player with at least one rule matching the cell becomes a
   candidate. A player's rules are combined with OR, not AND — one matching rule is
   enough — and the number that matched is recorded as the player's match strength.
2. **Winner.** The level's **claim strategy** picks one candidate, or leaves the cell
   empty. A cell no player matched is empty without the strategy being asked.

The default strategy is `FirstMatchClaimStrategy`, which awards the cell to the candidate
earliest in the roster. Since `createPlayers` puts the human first, the human player wins
every contested cell unless the level says otherwise. Pass a strategy as the seventh
argument to `Level.create` to change that — or, without writing code, pick one from the
**Claim strategy** list the "Choosing a level" custom picker offers:

| Strategy | Winner | Effect on play |
|----------|--------|----------------|
| `FirstMatchClaimStrategy` | Lowest roster index | The default. Roster position is a fixed priority |
| `IncumbentClaimStrategy` | The current occupant, if it still matches | Territory is defensible; a player is displaced only when its own rules stop matching |
| `StrongestMatchClaimStrategy` | Most matching rules | Rewards rule sets that fit the neighbourhood over roster position |
| `NeighbourMajorityClaimStrategy` | Most owned neighbours | Growth spreads from established territory rather than from priority |
| `RotatingPriorityClaimStrategy` | Roster index rotated by generation | Shares the first-match advantage across the roster over a run |
| `ContestedCellVoidStrategy` | Nobody, when contested | Boundaries erode into empty front lines instead of one player absorbing another |

All but `FirstMatchClaimStrategy` and `RotatingPriorityClaimStrategy` take another strategy
to settle what they leave undecided, so they compose:

```ts
IncumbentClaimStrategy.create(
  StrongestMatchClaimStrategy.create(FirstMatchClaimStrategy.create()),
);
```

Every strategy is a pure function of the grid, the roster, and the generation number — none
consults `Math.random()` — so the determinism guarantee below holds under all of them.

#### Determinism

`Simulation.run` is already a pure function of the grid and the players' rules, so fixing
the starting grid and the computer rules leaves the human's selection as the only variable
input. Given the same three rules, a level run is reproducible generation for generation:
the same grid, the same cell counts, the same death generation.

The guarantee is exactly that — from pressing "Start game" to the grid dying, no
randomness is consulted. `simulation.seedRandom` still exists for non-level use but is not
called by a level start, and the configuration screen still preselects three presets at
random, which happens before the player confirms and is outside the guarantee.

Player local simulation adds two inputs the guarantee does not cover: the human's keypresses,
and `RandomClaimedCellPositioning` when it is the selected positioning strategy. With
`FirstClaimedCellPositioning` and no keypresses, a player local game is as reproducible as a
global one.

### Hi-score

The hi-score list is owned by the simulation, not by the GUI. A score is the number of
generations the grid survived, so it is read straight from the simulation's generation
counter when a game ends. The list keeps the ten highest scores in descending order, and
the title screen renders whatever the simulation reports each time it is shown.

| Method | Description |
|--------|-------------|
| `simulation.recordHiScore(name)` | Record an entry for `name` scored at the current generation |
| `simulation.getHiScores()` | Read the current entries, highest score first |

Each game builds a new `Simulation`, so by default every simulation records into one
shared list that outlives them. Pass a `HiScore` as the fourth argument to
`SimulationOptions.create` to record into an isolated list instead.

### `GuiOptions` API

Create renderer options with the static factory method:

```typescript
const options = GuiOptions.create(
  width,        // canvas pixel width (positive number)
  height,       // canvas pixel height (positive number)
  container,    // HTMLElement that receives the <canvas>
  playerColors, // Map<playerId, 0xRRGGBB hex colour>
);
```

Throws `RangeError` if `width` or `height` is not positive.

### `SimulationRenderer` API

| Method | Description |
|--------|-------------|
| `SimulationRenderer.create(simulation, options)` | Create and initialise the renderer |
| `.start(onGameOver?)` | Begin the `requestAnimationFrame` animation loop. The optional callback receives the final generation number when the grid dies out |
| `.stop()` | Cancel the animation loop |
| `.render()` | Manually synchronise the scene to the current grid state |
| `.setFramesPerGeneration(frames)` | Hold each generation for `frames` animation frames. `1` is the fastest rate; throws `RangeError` below 1 |

### Example

```typescript
import { Simulation, SimulationOptions } from "./simulation";
import { GuiOptions, SimulationRenderer } from "./gui";

const simulation = new Simulation(SimulationOptions.create(100, 100));

const options = GuiOptions.create(
  800,
  800,
  document.body,
  new Map([[1, 0xff0000]]), // player 1 → red
);

SimulationRenderer.create(simulation, options).start();
```

