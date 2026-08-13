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

### In-game controls

While a game is running, two overlays sit on top of the simulation canvas:

- **Scoreboard** (top centre) — one row per participant showing a colour swatch and that
  participant's current number of living cells: the human player plus three computer
  players, each of which draws its own rules at random when the game starts.
- **Control bar** (bottom centre) — "Slow down" and "Speed up" step through five speed
  levels and the readout shows the current one. Level 5 advances one generation per
  animation frame, the fastest rate the renderer supports; each slower level holds a
  generation for twice as many frames. "Exit" abandons the game and returns to the title
  screen without asking the simulation to record a score.

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

