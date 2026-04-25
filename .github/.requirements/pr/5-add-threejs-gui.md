## Summary

Adds a small browser-based GUI under `src/gui/` that renders the `Simulation` grid in real time using Three.js. The GUI exposes a `SimulationRenderer` class with a static factory method and an animation loop that advances the simulation each frame.

## Motivation

The simulation currently runs headlessly with no visual output. Rendering the grid in a browser via Three.js provides immediate visual feedback for experimenting with cellular automata rules and player configurations, making the project demonstrable without additional tooling.

## Changes

### Files Deleted

- None

### Files Updated

- **`package.json`** — Add `three` to `dependencies` and `@types/three` to `devDependencies`.
- **`src/main.ts`** — Import `SimulationRenderer` and `GuiOptions` from `./gui`; wire up a `SimulationRenderer` instance and call `.start()` to begin the animation loop.

### Files Added

- **`src/gui/index.ts`** — Barrel export for the `gui` module; re-exports `GuiOptions` and `SimulationRenderer`.
- **`src/gui/GuiOptions.ts`** — `GuiOptions` interface declaring renderer configuration: `width`, `height`, `container: HTMLElement`, and `playerColors: Map<number, number>`.
- **`src/gui/SimulationRenderer.ts`** — `SimulationRenderer` class; owns a `THREE.WebGLRenderer`, `THREE.Scene`, `THREE.OrthographicCamera`, and one `THREE.Mesh` per grid cell; drives the animation loop via `requestAnimationFrame`.

## Type of Change

- [x] New feature (non-breaking change which adds functionality)
- [x] Documentation update

## Implementation Plan

### Phase 1 — Add Three.js dependency and create `src/gui` barrel

**Pre-condition**: `package.json` lists no Three.js entries; `src/gui/` does not exist.

1. In `package.json`, add `"three": "^0.165.0"` to `dependencies` and `"@types/three": "^0.165.0"` to `devDependencies`. This provides the Three.js runtime and TypeScript type declarations needed by all subsequent phases.
2. Create `src/gui/GuiOptions.ts` and declare `export interface GuiOptions` with four typed fields: `width: number` (canvas pixel width), `height: number` (canvas pixel height), `container: HTMLElement` (DOM node that receives the `<canvas>`), and `playerColors: Map<number, number>` (mapping from player `id` to a Three.js hex colour integer such as `0xff0000`). Add JSDoc to every field.
3. Create `src/gui/index.ts` as the module barrel; add `export { GuiOptions } from "./GuiOptions"` as the first export.

**Post-condition**: Running `npm install` resolves Three.js and its types; `GuiOptions` is importable from `"./gui"`.

---

### Phase 2 — Implement `SimulationRenderer` class

**Pre-condition**: Phase 1 is complete; `GuiOptions` is importable from `src/gui/GuiOptions.ts`.

**Requires Phase 1 to be complete.**

1. Create `src/gui/SimulationRenderer.ts`. Declare `export class SimulationRenderer` with a `private` constructor that accepts `(simulation: Simulation, options: GuiOptions)` and stores both on `private readonly` fields. The constructor must not perform any DOM operations; it only records the arguments.
2. Add static factory method `public static create(simulation: Simulation, options: GuiOptions): SimulationRenderer` to `SimulationRenderer`. Inside `create`: (a) validate that `options.width > 0` and `options.height > 0`, throwing `RangeError` on violation; (b) construct a new `SimulationRenderer`; (c) call a private `initThree()` method on the instance; (d) return the instance. Before this method, `SimulationRenderer` cannot be instantiated; after it, callers use `SimulationRenderer.create(sim, opts)`.
3. Add private method `initThree(): void` to `SimulationRenderer`. Inside it: (a) create `THREE.WebGLRenderer({ antialias: false })` and set its size via `options.width` and `options.height`; (b) append `renderer.domElement` to `options.container`; (c) create `THREE.Scene`; (d) create `THREE.OrthographicCamera` spanning the grid dimensions (`left=0, right=simulation.width, top=simulation.height, bottom=0, near=0.1, far=10`) and position it at `(0, 0, 1)` looking at the origin; (e) create one `THREE.Mesh` per cell using `new THREE.PlaneGeometry(1, 1)` and `new THREE.MeshBasicMaterial({ color: 0x000000 })`; position each mesh at `(x + 0.5, y + 0.5, 0)` and add it to the scene. Store the flat `THREE.Mesh[][]` grid as a `private` field `meshGrid`.
4. Add public method `render(): void` to `SimulationRenderer` that calls `this.simulation.getGrid()`, iterates over every cell, and updates `meshGrid[y][x].material.color.setHex(...)` using `options.playerColors.get(cell) ?? 0x000000`. Before this method, grid state is never reflected in the Three.js scene; after it, a single call synchronises the scene to the current simulation state.
5. Add public method `start(): void` to `SimulationRenderer` that sets up a `requestAnimationFrame` loop: each frame calls `this.simulation.run()`, then `this.render()`, then `this.renderer.render(this.scene, this.camera)`. The loop continues indefinitely until `stop()` is called (see step 6).
6. Add public method `stop(): void` to `SimulationRenderer` that stores the frame handle from `requestAnimationFrame` on a `private frameId: number | null` field and cancels it via `cancelAnimationFrame(this.frameId)`.

**Post-condition**: `SimulationRenderer` compiles under `npm run build`; calling `.create(sim, opts).start()` in a browser initiates the animation loop.

---

### Phase 3 — Export `SimulationRenderer` and update `src/main.ts`

**Pre-condition**: Phase 2 is complete; `SimulationRenderer` is fully implemented in `src/gui/SimulationRenderer.ts`.

**Requires Phase 2 to be complete.**

1. In `src/gui/index.ts`, add `export { SimulationRenderer } from "./SimulationRenderer"` below the existing `GuiOptions` export. Before this step `SimulationRenderer` is not accessible via the `gui` module; after it any consumer can import from `"./gui"`.
2. In `src/main.ts`, add imports `import { SimulationRenderer, GuiOptions } from "./gui"` below the existing `Simulation` import. Before this step `main.ts` has no knowledge of the GUI; after it the imports are in scope.
3. In `src/main.ts`, add example wiring code that constructs a `GuiOptions` object and calls `SimulationRenderer.create(simulation, options).start()`. Wrap the call in a guard (`if (typeof document !== "undefined"`) so the module remains importable in Node.js test environments without crashing. Before this step no renderer is created; after it running the file in a browser starts the animation loop.

**Post-condition**: `src/main.ts` compiles; importing the module in Node.js does not throw; opening an HTML file that bundles `main.ts` renders the simulation grid via Three.js.

---

## Testing

### TypeScript unit tests

No unit tests are added in this PR. Three.js requires a DOM environment (`requestAnimationFrame`, `HTMLElement`, `WebGLRenderer`) which is unavailable under Jest's default `node` environment. A follow-up PR will configure `jest-environment-jsdom` (or a Three.js mock) and add unit tests for `GuiOptions` validation and `SimulationRenderer.create` error paths.

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests passing (`npm run test`)

**Test coverage**: Existing tests (`Simulation.test.ts`, `SumRule.test.ts`, `GeometryRule.test.ts`) are unaffected by this PR; the new `src/gui/` code is excluded from the current test run.

### Validation status

> **Note**: Validation commands have not yet been executed because the implementation files do not yet exist. The checklist items below reflect the intended state after implementation.

| Command | Status |
|---------|--------|
| `npm run lint` | Pending — will run after implementation |
| `npm run build` | Pending — will run after implementation |
| `npm run typecheck` | Pending — will run after implementation |
| `npm run test` | Pending — existing tests expected to remain green; GUI tests deferred |

### Manual validation steps

| # | Check | How to verify |
|---|-------|---------------|
| 1 | Three.js canvas appears in browser | Open an HTML file bundling `src/main.ts`; confirm a `<canvas>` is appended to the container element |
| 2 | Grid cells render correct player colours | Set `playerColors: new Map([[1, 0xff0000]])` and confirm player-1 cells are red |
| 3 | Animation loop advances simulation | Observe cells changing each frame as `simulation.run()` is called |
| 4 | `stop()` halts animation | Call `renderer.stop()` from the browser console and confirm the canvas freezes |
| 5 | Node.js import does not crash | Run `node dist/main.js` and confirm no `document is not defined` error |

## Documentation Plan

| File | Changes |
|------|---------|
| `README.md` | Add a **Browser GUI** section describing how to install Three.js (`npm install`), bundle `src/main.ts` with a bundler (e.g., esbuild or Vite), and open the resulting HTML file. Document `GuiOptions` fields and the `SimulationRenderer.create / .start / .stop` API. |

## Related Issues

Closes #5

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

- Three.js uses a right-handed coordinate system; the `OrthographicCamera` is set up so `(0,0)` maps to the bottom-left of the grid and `(width, height)` maps to the top-right, consistent with the `Grid` type (`grid[y][x]`).
- The `SimulationRenderer` is deliberately decoupled from the simulation's tick rate: callers may replace the `requestAnimationFrame` loop with a fixed-interval timer by calling `render()` manually.
- If the project later moves to ES modules (`"type": "module"` in `package.json`), Three.js imports will work without change since Three.js ships both CJS and ESM builds.
