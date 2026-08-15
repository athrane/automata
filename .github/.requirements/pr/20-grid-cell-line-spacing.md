## Summary

Adds a one-pixel background-coloured gap between adjacent grid cells so individual cells are visually distinguishable instead of forming an unbroken field of colour. For the current 100×100 grid rendered on an 800×800 canvas, each cell's rendered footprint shrinks from the full 8×8 pixel allocation to 7×7 pixels, with the remaining pixel forming the gap between neighbours.

## Motivation

`SimulationRenderer` sized every cell mesh as a full `1x1` `PlaneGeometry`, so adjacent cells shared their pixel boundary with no separation. The grid boundary between same-coloured or same-player cells was invisible, making individual cells hard to make out at a glance. A thin gap the same colour as the renderer's background restores that boundary without changing simulation logic, canvas size, or grid dimensions.

## Changes

### Files Deleted

- None

### Files Updated

- **`src/gui/SimulationRenderer.ts`** — Adds a `GRID_LINE_WIDTH_PIXELS` constant (`1`) and computes `cellWidth`/`cellHeight` in `initThree()` by converting that pixel gap into world units using the existing canvas-to-grid ratio (`options.width` / `simulation.width` and the height equivalent). Each cell's `PlaneGeometry` is now sized `cellWidth x cellHeight` instead of a fixed `1x1`, so a symmetric half-pixel margin appears on every side of each cell and combines with its neighbour's margin into a one-pixel gap. Mesh centring and `render()`'s colour-update logic are unchanged.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Test coverage improvement

## Implementation Plan

### Phase 1 — Introduce the gap constant and compute per-axis cell scale

**Pre-condition**: `initThree()` builds every cell as a `THREE.PlaneGeometry(1, 1)` filling exactly one grid unit, with no gap between neighbours, and the pixel-per-unit ratio exists only implicitly as `options.width / simulation.width`.

**Steps**:
1. In `src/gui/SimulationRenderer.ts`, add `const GRID_LINE_WIDTH_PIXELS = 1;` alongside the other module-level constants, with a JSDoc comment describing it as the pixel width of the background-coloured gap between cells.
2. At the top of `initThree()`, after `this.camera.lookAt(0, 0, 0)`, compute `cellWidth = 1 - (GRID_LINE_WIDTH_PIXELS * this.simulation.width) / this.options.width` and `cellHeight = 1 - (GRID_LINE_WIDTH_PIXELS * this.simulation.height) / this.options.height`, converting the fixed pixel gap into world units via the canvas-to-grid ratio instead of a hardcoded fraction, so the gap stays exactly one pixel wide regardless of grid or canvas size.

**Post-condition**: `cellWidth` and `cellHeight` hold the per-cell geometry size in world units (`0.875` for the current 100-cell, 800px levels), but the mesh geometry in the loop below still uses the old `1x1` size.

### Phase 2 — Apply the computed size to each cell's geometry

**Pre-condition**: Phase 1 is complete; `cellWidth` and `cellHeight` are computed before the per-cell loop in `initThree()`. Depends on Phase 1.

**Steps**:
1. In the nested loop in `initThree()`, change `new THREE.PlaneGeometry(1, 1)` to `new THREE.PlaneGeometry(cellWidth, cellHeight)`, so each mesh's footprint shrinks to the computed size.
2. Leave `mesh.position.set(x + 0.5, y + 0.5, 0)` unchanged so meshes stay centred on their grid cell; since the geometry is now smaller than the full `1x1` unit, this centring leaves a symmetric half-pixel margin on every side, which meets the neighbouring cell's margin to form a one-pixel gap.
3. Leave `render()` unchanged — it still looks up meshes by grid coordinate and only updates material colour, so the gap does not affect colour updates or the simulation loop.

**Post-condition**: Every rendered cell is 7×7 pixels for the current 100×100, 800×800px levels, separated from its neighbours by a one-pixel gap that shows the renderer's black clear colour — the same colour already used for dead/unclaimed cells (`DEFAULT_CELL_COLOR`).

## Testing

### TypeScript unit tests

No test files were added or changed. `SimulationRenderer` has no existing unit test file — `tests/gui/` contains no `SimulationRenderer.test.ts` — because it drives a live Three.js `WebGLRenderer` against a real `<canvas>`, and the project's Vitest environment is `node` (`vite.config.ts`), with no DOM or WebGL context available to construct one. This PR does not change that: it only adjusts a numeric geometry calculation inside the existing, untested `initThree()` method.

- [ ] Unit tests added/updated — not applicable, see above
- [ ] Integration tests added/updated — not applicable
- [x] All tests passing (`npm run test`)

**Test coverage**: Unchanged — 267/267 existing tests still pass; this class was untested before and after this change.

### Manual validation steps

| # | Check | How to verify |
|---|-------|---------------|
| 1 | Grid shows a visible gap between cells | `npm run dev`, start a game, and confirm adjacent living cells are separated by a thin black line instead of touching directly. |
| 2 | Cell colours and gameplay unaffected | Play a few generations and confirm cell colour-by-player-id, wrap-around, and claim resolution behave as before — only the rendered footprint per cell changed. |
| 3 | Gap stays a crisp one pixel if canvas/grid ratio changes | Temporarily change `CANVAS_WIDTH`/`CANVAS_HEIGHT` in `GamePlayingScreen.ts`, or a level's grid size, and confirm the gap remains exactly one pixel rather than scaling proportionally with the cell size. |

These manual steps were not run against a live browser in this environment — no headless-browser tooling (`chromium-cli`, Playwright, Puppeteer) is installed, and installing one was out of scope for this change. The geometry was instead verified arithmetically: for the current 100×100 grid on an 800×800 canvas, `cellWidth = 1 - (1 * 100) / 800 = 0.875` world units, and `0.875 * (800 / 100) = 7` pixels, matching the requested 8×8 → 7×7 shrink.

## Documentation Plan

_Omit this section if no documentation changes are required._

No changes required — `README.md` documents `GuiOptions`/`SimulationRenderer` construction generically (canvas pixel width/height, player colours) and does not describe per-cell pixel sizing or grid-line rendering.

## Related Issues

Closes #20

## Checklist
- [x] Code follows project conventions (static factory methods, private constructors, no `any`, explicit types, guard clauses)
- [x] TypeScript types are correct (`npm run typecheck` passes)
- [x] Code lints without errors (`npm run lint` passes)
- [x] All tests pass (`npm run test` passes — 267/267)
- [x] Build succeeds (`npm run build` passes)
- [x] JSDoc comments added for public APIs — added for the new `GRID_LINE_WIDTH_PIXELS` constant
- [x] Updated documentation — none required, see Documentation Plan
- [x] No breaking changes — `SimulationRenderer`'s public API and constructor signature are unchanged; only the internal cell geometry size differs
- [ ] Commit messages follow Conventional Commits format — nothing committed yet

## Additional Notes

- **Implemented, not committed.** The change is in the working tree on `main`; no branch, commit, push, or `gh pr create` has been run.
- **Scope check.** The change touches only `initThree()` in `src/gui/SimulationRenderer.ts`; `render()`, `start()`, `stop()`, and `destroy()` are untouched, and no other file references cell geometry sizing.
- **No visual/browser verification performed.** This environment has no headless-browser tooling available (`chromium-cli`, Playwright, Puppeteer all absent), so the rendering change was validated by full pipeline (`lint`/`test`/`typecheck`/`build`) plus manual arithmetic against the known 100×100-grid/800×800-canvas configuration, not by an actual screenshot. The reviewer should run `npm run dev` and eyeball the grid before merging.
- **Background colour assumption.** The gap relies on the renderer's default WebGL clear colour, which is opaque black (`0x000000`) — the same value as `DEFAULT_CELL_COLOR`. `SimulationRenderer` never calls `scene.background` or `setClearColor`, so this was already true before this change; the PR does not introduce a new dependency on that default, but a future change to the clear colour would also need to keep it in sync with `DEFAULT_CELL_COLOR` for the gap to read as "background", not just "black".

**Suggested PR title**: `feat(gui): render a one-pixel gap between grid cells`
